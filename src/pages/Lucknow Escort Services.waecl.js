import wixWindowFrontend from 'wix-window-frontend';
import wixSeoFrontend from 'wix-seo-frontend';
import wixLocationFrontend from 'wix-location-frontend';
import { fetchActiveProfiles } from 'backend/portfolio.jsw';

$w.onReady(async function () {
    const isSSR = wixWindowFrontend.rendering.env === 'backend';
    const locationName = "Lucknow";
    const cacheKey = `${locationName.toLowerCase()}EscortsData`;

    // 1. FCP & LCP Optimization: Warmup Data
    // Retrieve profiles during server pre-render and hand off to frontend, eliminating client api lag.
    let profiles = [];
    if (isSSR) {
        profiles = await fetchActiveProfiles(locationName);
        wixWindowFrontend.warmupData.set(cacheKey, profiles);
        setupSEO(locationName, profiles);
    } else {
        profiles = wixWindowFrontend.warmupData.get(cacheKey);
        if (!profiles) {
            profiles = await fetchActiveProfiles(locationName);
        }
        
        // Render UI immediately if elements are ready
        hydrateListingUI(profiles);
    }
});

/**
 * Injects SEO tags and ItemList Schema during SSR.
 */
function setupSEO(city, items) {
    wixSeoFrontend.setTitle(`Verified Escorts in ${city} | Premium VIP companion services`)
        .catch(err => console.error("SEO title error", err));

    // Dynamic base URL to prevent canonical schema mismatch errors
    const baseSiteUrl = wixLocationFrontend.baseUrl.replace(/\/$/, "");

    const listItems = items.map((item, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "url": `${baseSiteUrl}/portfolio/${item.slug || item._id}`,
        "name": item.title || item.name || `Companion in ${city}`
    }));

    const itemListSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `VIP Companions in ${city}`,
        "description": `Browse premium verified companion profiles located in ${city}.`,
        "itemListElement": listItems
    };

    wixSeoFrontend.setStructuredData([itemListSchema])
        .catch(err => console.error("SEO schema setting failed", err));
}


/**
 * Hydrates standard Wix listing repeaters with cached profile data.
 */
function hydrateListingUI(items) {
    const repeater = $w("#profilesRepeater");
    if (repeater) {
        repeater.data = items;
        repeater.onItemReady(($item, itemData) => {
            $item("#profileImg").src = itemData.photo || itemData.image;
            $item("#profileImg").tooltip = itemData.name || itemData.title;
            $item("#profileNameTxt").text = itemData.name || itemData.title;
            $item("#profileAgeTxt").text = `${itemData.age || 21} Years`;
            $item("#profileLocationTxt").text = itemData.city || "Lucknow";
        });
    }
}

