/** Render signup UTM links and Deploy to Render Blueprint URL helper. */

/** Sign-up URL with fixed Ojus demo UTMs; `content` is the placement (e.g. navbar_button). */
export function renderSignupUrlWithUtms(content: string = "navbar_button"): string {
  const params = new URLSearchParams({
    utm_source: "github",
    utm_medium: "referral",
    utm_campaign: "ojus_demos",
    utm_content: content,
  });
  return `https://dashboard.render.com/register?${params.toString()}`;
}

export const WORKFLOWS_DOCS_URL = "https://render.com/docs/workflows";

/** Blueprint deploy deeplink for the given GitHub repo URL. */
export function deployToRenderUrl(repoUrl: string): string {
  return `https://render.com/deploy?repo=${encodeURIComponent(repoUrl)}`;
}
