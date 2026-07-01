/**
 * Converts legacy HTML pages to React component skeletons.
 * Extracts <style> blocks to CSS files and converts body HTML to JSX.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const ROUTE_MAP = {
  'index.html': '/',
  'products.html': '/products',
  'categories.html': '/categories',
  'cart.html': '/cart',
  'checkout.html': '/checkout',
  'login.html': '/login',
  'register.html': '/register',
  'profile.html': '/profile',
  'track-order.html': '/track-order',
  'admin.html': '/admin',
};

const PAGE_NAMES = {
  'index.html': 'Home',
  'products.html': 'Products',
  'categories.html': 'Categories',
  'cart.html': 'Cart',
  'checkout.html': 'Checkout',
  'login.html': 'Login',
  'register.html': 'Register',
  'profile.html': 'Profile',
  'track-order.html': 'TrackOrder',
  'admin.html': 'Admin',
};

function extractStyleAndBody(html) {
  let styleContent = '';
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = styleRegex.exec(html)) !== null) {
    styleContent += match[1] + '\n';
  }
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;
  return { styleContent, body };
}

function extractScripts(html) {
  const scripts = [];
  const scriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push(match[1]);
  }
  return scripts.join('\n\n');
}

function htmlToJsx(html) {
  let jsx = html;

  // Remove script tags from body
  jsx = jsx.replace(/<script[\s\S]*?<\/script>/gi, '');

  // HTML comments to JSX comments
  jsx = jsx.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');

  // class -> className (but not in URLs)
  jsx = jsx.replace(/\bclass=/g, 'className=');

  // for -> htmlFor
  jsx = jsx.replace(/\bfor=/g, 'htmlFor=');

  // Common attribute renames
  const attrMap = [
    ['tabindex', 'tabIndex'],
    ['readonly', 'readOnly'],
    ['colspan', 'colSpan'],
    ['rowspan', 'rowSpan'],
    ['maxlength', 'maxLength'],
    ['autocomplete', 'autoComplete'],
    ['crossorigin', 'crossOrigin'],
    ['cellpadding', 'cellPadding'],
    ['cellspacing', 'cellSpacing'],
    ['frameborder', 'frameBorder'],
    ['allowfullscreen', 'allowFullScreen'],
    ['viewbox', 'viewBox'],
    ['stroke-width', 'strokeWidth'],
    ['stroke-linecap', 'strokeLinecap'],
    ['stroke-linejoin', 'strokeLinejoin'],
    ['fill-rule', 'fillRule'],
    ['clip-rule', 'clipRule'],
    ['xmlns:xlink', 'xmlnsXlink'],
    ['xlink:href', 'xlinkHref'],
  ];
  for (const [from, to] of attrMap) {
    jsx = jsx.replace(new RegExp(`\\b${from}=`, 'g'), `${to}=`);
  }

  // Self-closing tags
  const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
  for (const tag of voidTags) {
    const regex = new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'gi');
    jsx = jsx.replace(regex, `<${tag}$1 />`);
  }

  // Fix double slashes from self-closing
  jsx = jsx.replace(/\s\/\/>/g, ' />');

  // Convert href="page.html" to data-route or keep for manual Link conversion
  for (const [htmlFile, route] of Object.entries(ROUTE_MAP)) {
    jsx = jsx.replace(new RegExp(`href="${htmlFile}"`, 'g'), `href="${route}"`);
    jsx = jsx.replace(new RegExp(`href='${htmlFile}'`, 'g'), `href='${route}'`);
  }

  // onclick="func()" -> onClick handler placeholder - keep as data-onclick for manual fix
  // For now convert simple patterns
  jsx = jsx.replace(/onclick="([^"]*)"/g, 'data-legacy-onclick="$1"');

  // style="..." inline - keep as is for now (React supports string style in some cases but not ideally)
  // Convert simple inline styles to object would be complex; React accepts style as string in dangerouslySetInnerHTML only
  // We'll use dangerouslySetInnerHTML for complex parts OR fix manually

  // selected -> defaultValue for select options handled separately
  jsx = jsx.replace(/<option([^>]*)\sselected/gi, '<option$1 defaultValue');

  return jsx.trim();
}

function convertFile(filename) {
  const htmlPath = path.join(root, filename);
  if (!fs.existsSync(htmlPath)) {
    console.log(`Skip ${filename} - not found`);
    return;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const pageName = PAGE_NAMES[filename];
  const { styleContent, body } = extractStyleAndBody(html);
  const scripts = extractScripts(html);
  const jsxBody = htmlToJsx(body);

  const cssDir = path.join(root, 'src', 'styles', 'pages');
  const pagesDir = path.join(root, 'src', 'pages');
  const hooksDir = path.join(root, 'src', 'hooks', 'pages');

  fs.mkdirSync(cssDir, { recursive: true });
  fs.mkdirSync(pagesDir, { recursive: true });
  fs.mkdirSync(hooksDir, { recursive: true });

  const cssFileName = `${pageName}.css`;
  fs.writeFileSync(path.join(cssDir, cssFileName), styleContent);

  const scriptFileName = `${pageName}Logic.js`;
  fs.writeFileSync(path.join(hooksDir, scriptFileName), `// Legacy page logic for ${pageName}\nexport function init${pageName}Logic() {\n${scripts}\n}\n`);

  const component = `import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/pages/${cssFileName}';
import { use${pageName}Page } from '../hooks/pages/use${pageName}Page';

export default function ${pageName}() {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  use${pageName}Page(containerRef, navigate);

  return (
    <div ref={containerRef} className="legacy-page ${pageName.toLowerCase()}-page">
${jsxBody.split('\n').map(line => '      ' + line).join('\n')}
    </div>
  );
}
`;

  fs.writeFileSync(path.join(pagesDir, `${pageName}.jsx`), component);
  console.log(`Converted ${filename} -> ${pageName}.jsx`);
}

const files = Object.keys(PAGE_NAMES);
files.forEach(convertFile);
console.log('Done!');
