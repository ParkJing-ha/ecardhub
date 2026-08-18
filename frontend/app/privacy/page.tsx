import InfoPage from "../../components/InfoPage";

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="Privacy" title="Privacy">
      <p>
        Invitely stores account details only for login and event management in
        this local development build. Passwords are hashed before they are saved.
      </p>
    </InfoPage>
  );
}
