import InfoPage from "../../components/InfoPage";

export default function ApiInfoPage() {
  return (
    <InfoPage eyebrow="API" title="Developer API">
      <p>
        The app now includes working auth endpoints at /api/auth/register,
        /api/auth/login, /api/auth/logout, and /api/auth/me.
      </p>
    </InfoPage>
  );
}
