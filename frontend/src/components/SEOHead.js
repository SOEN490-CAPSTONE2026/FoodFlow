import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL =
  process.env.REACT_APP_SITE_URL || 'https://foodflow-org.up.railway.app';

const DEFAULT_DESCRIPTION =
  'FoodFlow connects restaurants, grocery stores, and businesses with verified charities and shelters to redistribute surplus food in real time — reducing waste and fighting food insecurity.';

const DEFAULT_OG_IMAGE = `${SITE_URL}/Logo.png`;

/**
 * SEOHead — drop this into any page component to control meta tags.
 *
 * Props:
 *   title        {string}  Page title. Rendered as "<title> | FoodFlow".
 *                          Omit to use the default site title.
 *   description  {string}  Meta description. Defaults to the site description.
 *   canonical    {string}  Path portion of the canonical URL, e.g. "/privacy-policy".
 *                          Defaults to the site root.
 *   noindex      {boolean} Set true on every auth-required or zero-value page.
 *   ogTitle      {string}  Override OG title (defaults to resolved title).
 *   ogDescription{string}  Override OG description (defaults to description).
 *   ogImage      {string}  Full URL to the OG share image (defaults to logo).
 *   ogType       {string}  OG type. Defaults to "website".
 */
const SEOHead = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical = '/',
  noindex = false,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
}) => {
  const resolvedTitle = title
    ? `${title} | FoodFlow`
    : 'FoodFlow | Surplus Food Redistribution Platform';
  const canonicalUrl = `${SITE_URL}${canonical}`;

  return (
    <Helmet>
      {/* ── Basic ── */}
      <title>{resolvedTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* ── Robots ── */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* ── Open Graph ── */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={ogTitle || resolvedTitle} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="FoodFlow" />
    </Helmet>
  );
};

export default SEOHead;
