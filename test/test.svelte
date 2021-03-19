<script context="module">
  import Document from "../components/Document.svelte";

  import { generateLinkContext } from "../end/utils/link";
  import { getSiteId } from "../end/api";
  import { isEmpty } from "../end/utils/objects";
  import { loadSite } from "../models/site";
  import { loadDocument } from "../models/document";

  export async function preload(page, session) {
    const site = await loadSite(getSiteId(), session.token);
    let value = "hello";
    let slug = null;
    let parentSlug = null;
    let parentDoc = null;

    if (page.params.slug.length === 2) {
      parentSlug = page.params.slug[0];
      slug = page.params.slug[1];
    }
    else if (page.params.slug.length === 1) {
      slug = page.params.slug[0];
    }
    else {
      this.error("404", "Not Found");
    }

    const doc = await loadDocument(site, slug, session.token);

    if (!doc) {
      this.error("404", "Not found");
      return;
    }

    const template = site.attributes.config.templates.find(
      t => t.label === doc.attributes.template
    );

    if (!template.hasContent) {
      this.error("404", "Not found");
      return;
    }

    if (parentSlug && !template.parentSlug) {
      // If there is no static parentSlug, load the parent page.
      parentDoc = await loadDocument(site, parentSlug, session.token);

      if (!parentDoc) {
        this.error("404", "Not found");
        return;
      }
    }
    else if (parentSlug && parentSlug !== template.parentSlug) {
      // If there is a static parentSlug for this template, then it should match the param.
      this.error("404", "Not found");
    }

    if (!isEmpty(doc.attributes.content.redirect)) {
      const linkContext = await generateLinkContext(site, null, doc.attributes.content.redirect, session.token);
      this.redirect(302, linkContext.href);
    }
    else {
      return { site, parentDoc, doc };
    }
  }
</script>

<script>
  export let site;
  export let parentDoc;
  export let doc;
</script>

<svelte:head>
  <title>
    {doc.attributes.content.seoTitle ? 
      doc.attributes.content.seoTitle :
      [
        doc ? doc.attributes.title : "",
        parentDoc ? parentDoc.attributes.title : "",
        site.attributes.attrs.siteTitle || site.attributes.name
      ].filter(String).join(" | ")
    }
  </title>

  <div>
    Hello World
  </div>

  {#if doc.attributes.content.seoDescription}
    <meta name="description" content={doc.attributes.content.seoDescription} />
  {/if}
</svelte:head>

<Document {doc} {parentDoc} />
