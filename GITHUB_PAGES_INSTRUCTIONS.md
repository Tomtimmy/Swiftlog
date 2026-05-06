# GitHub Pages Deployment for SwiftConnect

Since the automated workflow was causing push permission issues, here is the content you can add back to your repository manually if you grant the AI Studio app "Workflows" permissions, or if you set up the action yourself on GitHub.

### Manual Setup
1. In your GitHub repository, go to **Settings > Actions > General**.
2. Under "Workflow permissions", select **Read and write permissions**.
3. Create a file at `.github/workflows/static.yml` and paste the content below.

---

```yaml
# Simple workflow for deploying static content to GitHub Pages
name: Deploy static content to Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

*Note: For the full-stack version with the database to work on GitHub Pages, you would need to host the API/Server separately (e.g. on Render or Railway) and point the frontend to it.*
