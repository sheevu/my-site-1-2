import wixWindowFrontend from 'wix-window-frontend';
import wixSeoFrontend from 'wix-seo-frontend';
import wixLocationFrontend from 'wix-location-frontend';

$w.onReady(async function () {
    const isSSR = wixWindowFrontend.rendering.env === 'backend';
    const cacheKey = "currentProfileData";

    // 1. FCP & LCP Optimization: Warmup Data
    // Cache the dynamic item during backend SSR, passing it to the browser to eliminate initial API lag on the client.
    let profile = null;
    if (isSSR) {
        profile = await fetchCurrentItem();
        if (profile) {
            wixWindowFrontend.warmupData.set(cacheKey, profile);
            setupProfileSEO(profile);
        }
    } else {
        profile = wixWindowFrontend.warmupData.get(cacheKey);
        if (!profile) {
            profile = await fetchCurrentItem();
        }
        
        if (profile) {
            hydrateProfileUI(profile);
        }
    }
});

/**
 * Gets the current item from the dynamic dataset.
 */
function fetchCurrentItem() {
    return new Promise((resolve) => {
        const dataset = $w("#dynamicDataset");
        if (!dataset) {
            resolve(null);
            return;
        }

        const handleDatasetReady = () => {
            resolve(dataset.getCurrentItem());
        };

        if (dataset.getCurrentItem()) {
            handleDatasetReady();
        } else {
            dataset.onReady(handleDatasetReady);
        }
    });
}

/**
 * Injects dynamic titles and structured JSON-LD schemas on SSR.
 */
function setupProfileSEO(profile) {
    const name = profile.title || profile.name || "VIP Companion";
    const city = profile.city || "Lucknow";
    const slug = profile.slug || profile._id;

    wixSeoFrontend.setTitle(`${name} - Premium Companion in ${city} | VIP Profile`)
        .catch(err => console.error("SEO dynamic title failed", err));

    const baseSiteUrl = wixLocationFrontend.baseUrl.replace(/\/$/, "");

    // Structured JSON-LD schema combining ProfilePage and Person details
    const profileSchema = {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "mainEntity": {
            "@type": "Person",
            "name": name,
            "jobTitle": "Premium Companion",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": city,
                "addressCountry": "IN"
            },
            "image": profile.photo || profile.image,
            "description": profile.description || `Meet premium companion ${name} in ${city}. Verified profile and details.`
        }
    };


    wixSeoFrontend.setStructuredData([profileSchema])
        .catch(err => console.error("SEO profile schema setting failed", err));
}

/**
 * Smoothly hydrates frontend elements with profile data.
 */
function hydrateProfileUI(profile) {
    // Avoid layout shifts by binding values directly before show
    if (profile.name || profile.title) {
        $w("#profileNameTitle").text = profile.name || profile.title;
    }
    if (profile.age) {
        $w("#profileAgeVal").text = `${profile.age} Years`;
    }
    if (profile.city) {
        $w("#profileCityVal").text = profile.city;
    }
}

