import wixWindowFrontend from 'wix-window-frontend';
import wixSeoFrontend from 'wix-seo-frontend';
import wixLocationFrontend from 'wix-location-frontend';

$w.onReady(function () {
    // 1. Performance: Check rendering cycle (SSR vs. CSR)
    // Runs code immediately on backend for SEO crawling, and defers non-essential client scripts.
    const isSSR = wixWindowFrontend.rendering.env === 'backend';
    const path = wixLocationFrontend.path;
    const isHomepage = path.length === 0;

    // 2. Technical SEO: Prevent Canonical URL Errors Site-Wide
    // Dynamically generates the clean canonical URL (strips query parameters, hashtags, and trailing slashes)
    // based on the active domain (handles staging and custom domains automatically).
    if (isSSR) {
        const cleanCanonicalUrl = wixLocationFrontend.url.split('?')[0].split('#')[0].replace(/\/$/, "");
        wixSeoFrontend.setLinks([
            { rel: "canonical", href: cleanCanonicalUrl }
        ]).catch(err => console.error("Global canonical setting failed", err));

        // Inject global and homepage-specific SEO structures
        injectGlobalSEO(isHomepage);
    } else {
        // Runs on client only, allowing faster visual render (improving FCP/LCP)
        initializeClientScripts(isHomepage);
    }
});

/**
 * Injects structured schema.org data for SEO crawlers during server rendering.
 */
function injectGlobalSEO(isHomepage) {
    const schemas = [];

    // Global Website Schema
    const baseSiteUrl = wixLocationFrontend.baseUrl.replace(/\/$/, "");
    schemas.push({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "GG Companion Portal",
        "url": baseSiteUrl,
        "potentialAction": {
            "@type": "SearchAction",
            "target": `${baseSiteUrl}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string"
        }
    });

    // Homepage-specific SEO Enhancements (Local Service / Directory Directory Schema)
    if (isHomepage) {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "DirectoryOverview",
            "name": "GG Premium Companion Directory",
            "description": "Verified elite escort and VIP companion directory services in India.",
            "url": baseSiteUrl,
            "provider": {
                "@type": "Organization",
                "name": "GG Portal",
                "url": baseSiteUrl
            }
        });
    }

    wixSeoFrontend.setStructuredData(schemas)
        .catch(err => console.error("SEO global schema injection failed", err));
}

/**
 * Defer non-critical scripts and setup client listeners to maximize FCP.
 */
function initializeClientScripts(isHomepage) {
    // 3. FCP/LCP Deferral Optimization
    // Delay third-party analytics and live chat widgets to free up the main thread
    setTimeout(() => {
        // This is where external trackers, pixels, or widgets (e.g. GTM, GA4, support chats) are initialized.
        // It prevents them from blocking the initial page paint.
        console.log("FCP/LCP Deferral: Global third-party widgets and non-critical scripts deferred.");
    }, 1200);

    // 4. Homepage-Specific Image & LCP Optimization
    if (isHomepage) {
        // Set optimal alt tags and titles for homepage hero images to maximize SEO indexing
        const heroBanner = $w("#heroBannerImg");
        if (heroBanner) {
            heroBanner.alt = "Verified VIP Companions and Elite Escort Directory Services";
            heroBanner.tooltip = "Verified Companions";
        }
        
        // Defer below-the-fold homepage elements
        setTimeout(() => {
            const footerGallery = $w("#footerGallery");
            if (footerGallery) {
                // Ensure footer galleries or heavy homepage repeaters are made visible only after fold renders
                footerGallery.show();
            }
        }, 1000);
    }

    // Prevent Layout Shifts: Hydrate header menu styling if necessary
    const header = $w('#header1');
    if (header) {
        header.style.opacity = 1; // Smooth reveal to prevent jarring shift
    }
}

