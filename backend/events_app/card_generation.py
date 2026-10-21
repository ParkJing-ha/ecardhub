"""Local, self-contained invitation artifacts from immutable card data."""

import base64
import io
import re
import secrets
import textwrap
from functools import lru_cache
from xml.etree import ElementTree as ET

from django.utils import timezone
import qrcode
from qrcode.image.svg import SvgPathFillImage

from .models import Guest, Invitation


SVG_NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG_NS)


def new_card_code():
    # 128 random bits; independent of event/guest IDs and safe for QR lookup.
    return f"CARD-{secrets.token_hex(16).upper()}"


def bulk_create_invitations(cards):
    """Persist a bounded batch while preserving Invitation.save RSVP behavior."""
    if not cards:
        return []
    persisted = Invitation.objects.bulk_create(cards, batch_size=100)
    # bulk_create bypasses save(). Keep its RSVP date side effect in one update,
    # preserving an existing date instead of changing it on retries or races.
    rsvp_guest_ids = {
        card.guest_id for card in cards
        if card.rsvp_status != "pending" and not card.guest.rsvp_date
    }
    if rsvp_guest_ids:
        Guest.objects.filter(pk__in=rsvp_guest_ids, rsvp_date__isnull=True).update(
            rsvp_date=timezone.now(),
        )
    return persisted


def svg_data_url(value):
    encoded = base64.b64encode(value.encode("utf-8")).decode("ascii")
    return f"data:image/svg+xml;base64,{encoded}"


@lru_cache(maxsize=256)
def qr_svg(data):
    if not data:
        return ""
    buffer = io.BytesIO()
    code = qrcode.QRCode(box_size=8, border=4)
    code.add_data(data)
    code.make(fit=True)
    code.make_image(image_factory=SvgPathFillImage).save(buffer)
    return buffer.getvalue().decode("utf-8")


def card_snapshot(invitation):
    if not invitation.card_generation_id:
        return {}
    generation = invitation.card_generation
    return {
        "event": generation.event_data,
        "template": generation.template_data,
        "guest": invitation.guest_snapshot,
        "invitation_code": invitation.invitation_code,
    }


def _clean_text(value):
    # XML 1.0 rejects control characters, including those in user supplied text.
    return "".join(
        character for character in str(value or "")
        if character in "\t\n\r" or 32 <= ord(character) <= 0xD7FF
        or 0xE000 <= ord(character) <= 0xFFFD
        or 0x10000 <= ord(character) <= 0x10FFFF
    )


def _color(value, fallback):
    return value if isinstance(value, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", value) else fallback


def render_card_svg(invitation):
    """Generate an SVG with no scripts, external URLs, or unescaped user HTML."""
    snapshot = card_snapshot(invitation)
    if not snapshot:
        return ""
    event, template, guest = (snapshot[key] for key in ("event", "template", "guest"))
    background = _color(template.get("background_color"), "#FBF7F0")
    primary = _color(template.get("primary_color"), "#7A2E45")
    accent = _color(template.get("accent_color"), "#C9A24B")
    foreground = _color(template.get("text_color"), "#2A1A2E")
    font = _clean_text(template.get("font_family") or "Georgia")
    sans_serif = any(name in font.lower() for name in (
        "inter", "arial", "helvetica", "roboto", "montserrat", "poppins", "sans",
    ))
    font_stack = f"{font}, Arial, sans-serif" if sans_serif else f"{font}, Georgia, serif"
    svg = ET.Element(f"{{{SVG_NS}}}svg", {
        "viewBox": "0 0 600 800", "width": "600", "height": "800",
        "role": "img", "aria-label": _clean_text(f"Invitation for {guest.get('full_name', '')}"),
    })

    def element(tag, attrs, parent=svg):
        return ET.SubElement(parent, f"{{{SVG_NS}}}{tag}", {key: str(value) for key, value in attrs.items()})

    element("rect", {"width": 600, "height": 800, "fill": background})
    image = template.get("image_data_url", "")
    uploaded = isinstance(image, str) and image.startswith((
        "data:image/png;base64,", "data:image/jpeg;base64,", "data:image/webp;base64,",
    ))
    if uploaded:
        element("image", {
            "href": image, "width": 600, "height": 800,
            "preserveAspectRatio": "xMidYMid slice",
        })
        element("rect", {
            "x": 54, "y": 68, "width": 492, "height": 102,
            "rx": 12, "fill": background, "fill-opacity": "0.92",
        })
        element("rect", {
            "x": 174, "y": 578, "width": 252, "height": 164,
            "rx": 12, "fill": background, "fill-opacity": "0.96",
        })
    layout = template.get("layout") or "centered"
    if not uploaded and layout == "frame":
        element("rect", {"x": 38, "y": 38, "width": 524, "height": 724, "rx": 12,
                         "fill": "none", "stroke": accent, "stroke-width": 2})
        element("rect", {"x": 46, "y": 46, "width": 508, "height": 708, "rx": 8,
                         "fill": "none", "stroke": accent, "stroke-width": 1})
    elif not uploaded and layout == "split":
        element("rect", {"x": 574, "width": 26, "height": 800, "fill": primary})
    left = not uploaded and layout in {"left-aligned", "left", "split"}
    text_x, anchor = (66, "start") if left else (300, "middle")

    def text(value, y, size=20, color=foreground, max_lines=2, chars=40, line_height=None):
        node = element("text", {
            "x": text_x, "y": y, "text-anchor": anchor, "font-size": size,
            "fill": color, "font-family": font_stack,
        })
        lines = textwrap.wrap(_clean_text(value), width=chars) or [""]
        if len(lines) > max_lines:
            lines = lines[:max_lines]
            lines[-1] = lines[-1].rstrip() + "…"
        for index, line in enumerate(lines):
            span = element("tspan", {"x": text_x, "dy": 0 if index == 0 else line_height or size * 1.3}, node)
            span.text = line

    if uploaded:
        # Uploaded artwork already carries the saved event design. Add only the
        # per-guest elements rather than covering or reprinting that artwork.
        text("Dear", 94, 14, primary, max_lines=1)
        text(guest.get("full_name"), 124, 24, primary, chars=36, max_lines=2)
        element("image", {"href": svg_data_url(qr_svg(invitation.qr_data)),
                          "x": 242, "y": 586, "width": 116, "height": 116})
        node = element("text", {"x": 300, "y": 725, "text-anchor": "middle",
                                "font-family": "monospace", "font-size": 10, "fill": foreground})
        node.text = invitation.invitation_code
        return ET.tostring(svg, encoding="unicode")

    text("YOU ARE INVITED", 90, 14, primary, max_lines=1)
    text(event.get("title"), 132, 30, primary, chars=28)
    text(event.get("host_family_name"), 205, 16, chars=45, max_lines=1)
    text("Dear", 245, 16, chars=45, max_lines=1)
    text(guest.get("full_name"), 275, 26, primary, chars=32)
    text(event.get("card_message") or "Please join us for this special celebration.",
         350, 18, chars=45, max_lines=4, line_height=23)
    event_date = event.get("event_date") or ""
    event_time = (event.get("event_time") or "")[:5]
    text(" · ".join(filter(None, [event_date, event_time])), 452, 20, primary, max_lines=1)
    text(event.get("venue"), 480, 18, chars=45, max_lines=2)
    if event.get("rsvp_deadline") or event.get("rsvp_reply_phone"):
        text("RSVP " + " · ".join(filter(None, [event.get("rsvp_deadline"), event.get("rsvp_reply_phone")])),
             537, 13, chars=60, max_lines=1)
    colors = event.get("dress_code_colors") or []
    for index, color in enumerate(colors[:8]):
        element("circle", {"cx": 300 + (index - (min(len(colors), 8) - 1) / 2) * 20,
                           "cy": 558, "r": 6, "fill": _color(color, accent)})
    element("image", {"href": svg_data_url(qr_svg(invitation.qr_data)),
                      "x": 408 if layout == "split" else 238, "y": 578,
                      "width": 124, "height": 124})
    code_node = element("text", {"x": 300, "y": 727, "text-anchor": "middle",
                                 "font-family": "monospace", "font-size": 12, "fill": foreground})
    code_node.text = invitation.invitation_code
    return ET.tostring(svg, encoding="unicode")
