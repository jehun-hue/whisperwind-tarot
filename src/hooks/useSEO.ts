import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  lang: string;
  ogImage?: string;
  canonical?: string;
}

export function useSEO({ title, description, lang, ogImage, canonical }: SEOProps) {
  useEffect(() => {
    // Set lang attribute
    document.documentElement.lang = lang;

    // Title
    document.title = title;

    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description);

    // OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", description);

    if (ogImage) {
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg) ogImg.setAttribute("content", ogImage);

      const twImg = document.querySelector('meta[name="twitter:image"]');
      if (twImg) twImg.setAttribute("content", ogImage);
    }

    // Canonical
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    return () => {
      // Reset to defaults on unmount
      document.documentElement.lang = "en";
      document.title = "AI Tarot Reading";
    };
  }, [title, description, lang, ogImage, canonical]);
}
