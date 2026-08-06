# Deployment

The site is designed for GitHub Pages with GitHub Actions as the Pages source. The workflows are:

- .github/workflows/check-site.yml renders the complete site on pushes and pull requests and runs the repository checks.
- .github/workflows/publish-site.yml renders, validates, and deploys the site on pushes to main or by manual workflow execution.

## Initial setup

1. Create a public repository named sarna-database in the department’s GitHub organization.
2. Replace github-organization in _variables.yml with the confirmed organization slug.
3. Replace project-email in _variables.yml with the confirmed project address.
4. Push the default branch named main.
5. In the repository’s Pages settings, select **GitHub Actions** as the source.
6. Confirm the first workflow run and the generated project URL:
   https://<organization>.github.io/sarna-database/.

Until the organization slug is confirmed, the documented target is
https://GITHUB_ORG_PLACEHOLDER.github.io/sarna-database/ (a configuration marker, not a live link).

The site uses relative internal links and does not assume a custom domain. The organization and email placeholders are intentionally safe to leave in place during local development.

## Custom-domain support

No CNAME file is included initially. If a custom domain is approved later:

1. Obtain institutional or project approval.
2. Select the domain.
3. Verify domain ownership in GitHub.
4. Configure the repository’s Pages settings.
5. Add the required DNS records.
6. Add CNAME only after the domain is confirmed.
7. Verify HTTPS.
8. Retain the GitHub Pages URL as the technical fallback.

The optional custom-domain value in _variables.yml is documentation space only; it does not activate a domain.

## Search indexing

The placeholder site includes a noindex directive to reduce premature search-engine indexing. Remove that directive as part of the data-release pull request after the first validated release is ready.

## Zenodo

The future release workflow will generate a release package but will not upload, publish, or overwrite a Zenodo record automatically. Upload and publication remain deliberate manual actions.
