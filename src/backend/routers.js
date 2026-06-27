import { redirect, next } from 'wix-router';
import wixData from 'wix-data';

/**
 * beforeRouter hook for the portfolio router.
 * Checks for uppercase URLs, trailing slashes, and database validations to prevent broken links.
 */
export async function portfolio_beforeRouter(request) {
    const path = request.path; // Array of path segments
    const fullPathString = path.join('/');
    
    // 1. SEO Rule: Enforce lowercase paths
    const lowerPathString = fullPathString.toLowerCase();
    if (fullPathString !== lowerPathString) {
        return redirect(`/${lowerPathString}`, "301");
    }

    // 2. SEO Rule: Strip trailing slashes
    if (fullPathString.endsWith('/')) {
        const cleanPath = fullPathString.slice(0, -1);
        return redirect(`/${cleanPath}`, "301");
    }

    // 3. Database Validation & Broken Link Prevention
    // If accessing a specific profile item (e.g., /portfolio/slug-name)
    if (path.length > 0) {
        const profileSlug = path[0];
        
        try {
            // Check if profile exists and is active in the database
            const profileQuery = await wixData.query("Portfolio")
                .eq("slug", profileSlug)
                .or(wixData.query("Portfolio").eq("_id", profileSlug))
                .find({ suppressAuth: true });
                
            if (profileQuery.items.length === 0) {
                // Profile doesn't exist. Prevent a 404 crawl error.
                // Redirect permanently to the main listing directory.
                return redirect("/lucknow-escort-services", "301");
            }
            
            const profile = profileQuery.items[0];
            if (profile.status === "inactive" || profile.status === "deleted") {
                // Profile is no longer active. Redirect to directory.
                return redirect("/lucknow-escort-services", "301");
            }
        } catch (error) {
            console.error("Router DB query error: ", error);
        }
    }

    return next();
}

/**
 * afterRouter hook for the portfolio router.
 * Optimizes response headers or handles post-routing logic.
 */
export function portfolio_afterRouter(request, response) {
    // Add caching headers to improve LCP/FCP on repetitive loads
    if (response.status === 200) {
        response.headers = {
            ...response.headers,
            "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=600"
        };
    }
    return response;
}

/**
 * afterSitemap hook for dynamic sitemaps.
 * Ensures search engines index only high-quality, valid, active profile pages.
 */
export function portfolio_afterSitemap(sitemapRequest, sitemapEntries) {
    // Filter sitemap entries to ensure only active, valid pages are indexed
    const filteredEntries = sitemapEntries.filter(entry => {
        const isTestPage = entry.pageName && entry.pageName.toLowerCase().includes('test');
        const isDraft = entry.title && entry.title.includes('[DRAFT]');
        return !isTestPage && !isDraft;
    });

    // Optimize priority and change frequency for SEO crawlers
    return filteredEntries.map(entry => {
        entry.changeFrequency = "daily";
        entry.priority = 0.8;
        return entry;
    });
}

/**
 * afterRouter hook for Lucknow Escorts Portfolio router.
 */
export function lucknow_escorts_portfolio_afterRouter(request, response) {
    if (response.status === 200) {
        response.headers = {
            ...response.headers,
            "Cache-Control": "public, max-age=3600, s-maxage=86400"
        };
    }
    return response;
}