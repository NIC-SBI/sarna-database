# Deployment

The public website is deployed at <https://nic-sbi.github.io/sarna-database/> from the `main` branch through GitHub Pages.

The GitHub Actions workflows are:

- `.github/workflows/check-site.yml`, which renders and validates the complete site on pushes and pull requests; and
- `.github/workflows/publish-site.yml`, which renders, validates, and deploys the site on pushes to `main` or by manual workflow execution.

The repository's Pages source must remain set to **GitHub Actions**. The site uses relative internal links so it works correctly under the `/sarna-database/` project path.

## Custom-domain support

No CNAME file is included. If a custom domain is approved later:

1. Obtain institutional or project approval.
2. Select the domain.
3. Verify domain ownership in GitHub.
4. Configure the repository’s Pages settings.
5. Add the required DNS records.
6. Add CNAME only after the domain is confirmed.
7. Verify HTTPS.
8. Retain the GitHub Pages URL as the technical fallback.

The optional `custom-domain` value in `_variables.yml` is documentation only; it does not activate a domain.

## Search indexing

The public site is configured with `index, follow`. Keep the validation check that prevents an accidental return to `noindex`.

## Zenodo

The authoritative v1.0.0 release is archived at <https://doi.org/10.5281/zenodo.21871232>. Uploading, publishing, or replacing a Zenodo release remains a deliberate manual action and is not performed by the site deployment workflow.
