"""Turn the SVGs in assets/app icons/ into react-native-svg components.

Every icon takes `color` (stroke/fill) and `size`. Strokes and fills that were
hard-coded black become the colour prop, so the same glyph works on light and
dark surfaces and can be tinted green when a row is 'active'.
"""
import re, os, glob

SRC = 'assets/app icons'
OUT = 'components/icons/AppIcons.tsx'

NAMES = {
    'broker icon': 'BrokerIcon',
    'call us': 'CallIcon',
    'closed eye': 'EyeClosedIcon',
    'delete': 'DeleteIcon',
    'email support': 'EmailSupportIcon',
    'history': 'HistoryIcon',
    'live chat': 'LiveChatIcon',
    'log out': 'LogOutIcon',
    'notifications': 'NotificationsIcon',
    'open eye': 'EyeOpenIcon',
    'payment card icon': 'PaymentCardIcon',
    'personal data': 'PersonalDataIcon',
    'portfolio analytics': 'PortfolioAnalyticsIcon',
    'search icon': 'SearchIcon',
    'security': 'SecurityIcon',
    'settings': 'SettingsIcon',
    'verify icon': 'VerifyIcon',
}

ATTR = {
    'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap',
    'stroke-linejoin': 'strokeLinejoin', 'fill-rule': 'fillRule',
    'clip-rule': 'clipRule', 'stroke-miterlimit': 'strokeMiterlimit',
}
TAGS = {'path': 'Path', 'circle': 'Circle', 'rect': 'Rect', 'line': 'Line',
        'ellipse': 'Ellipse', 'polyline': 'Polyline', 'polygon': 'Polygon', 'g': 'G'}

def convert(path):
    s = open(path, encoding='utf-8').read()
    view = re.search(r'viewBox="([^"]+)"', s).group(1)
    root = re.search(r'<svg[^>]*>', s).group(0)
    root_fill = re.search(r'fill="([^"]+)"', root)
    s = re.sub(r'<!--.*?-->|<\?xml.*?\?>|<!DOCTYPE.*?>', '', s, flags=re.S)
    s = re.sub(r'<title>.*?</title>|<desc>.*?</desc>|<style.*?</style>', '', s, flags=re.S)
    s = re.sub(r'<g id="SVGRepo_(bg|tracer)Carrier"[^>]*/>', '', s)
    m = re.search(r'<g id="SVGRepo_iconCarrier"[^>]*>(.*)</g>', s, flags=re.S)
    inner = m.group(1) if m else re.search(r'<svg[^>]*>(.*)</svg>', s, flags=re.S).group(1)
    inner = re.sub(r'<defs>.*?</defs>', '', inner, flags=re.S)
    inner = re.sub(r'\s(id|class)="[^"]*"', '', inner)
    # a stray "#000CCCCCC" in one file is an authoring typo for black
    inner = re.sub(r'(stroke|fill)="(#000000|#000|#000CCCCCC|black)"', r'\1={color}', inner)
    for a, b in ATTR.items():
        inner = inner.replace(a + '=', b + '=')
    for a, b in TAGS.items():
        inner = re.sub(r'<%s\b' % a, '<%s' % b, inner)
        inner = inner.replace('</%s>' % a, '</%s>' % b)
    # numeric attributes must be JSX expressions
    inner = re.sub(r'(strokeWidth|cx|cy|r|x|y|width|height|rx|ry)="([\d.]+)"', r'\1={\2}', inner)
    inner = re.sub(r'\s+', ' ', inner).strip()
    # A root-level fill applies to children that set none - only the
    # filled glyphs (delete, log out, settings, verify) rely on it.
    default_fill = 'color' if root_fill and root_fill.group(1) not in ('none',) else 'none'
    return view, inner, default_fill

parts = []
for path in sorted(glob.glob(os.path.join(SRC, '*.svg'))):
    slug = os.path.splitext(os.path.basename(path))[0]
    comp = NAMES[slug]
    view, inner, fill = convert(path)
    fill_expr = '{color}' if fill == 'color' else '"none"'
    parts.append(
        f'/** {slug}.svg */\n'
        f'export function {comp}({{ color = "#000", size = 22 }}: IconProps) {{\n'
        f'  return (\n'
        f'    <Svg width={{size}} height={{size}} viewBox="{view}" fill={fill_expr}>\n'
        f'      {inner}\n'
        f'    </Svg>\n'
        f'  );\n}}'
    )

header = '''/**
 * Pine's app icon set, generated from assets/app icons/*.svg.
 *
 * Every icon takes `color` and `size`; black strokes and fills in the source
 * files became the colour prop so one glyph serves light and dark surfaces.
 * Bottom-tab icons are deliberately NOT here - they have their own artwork.
 *
 * Regenerate after changing a source file:
 *     python scripts/gen-app-icons.py
 */
import React from "react";
import Svg, { Path, Circle, Rect, Line, Ellipse, Polyline, Polygon, G } from "react-native-svg";

export type IconProps = { color?: string; size?: number };

'''
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w', encoding='utf-8').write(header + '\n\n'.join(parts) + '\n')
print('generated', len(parts), 'icons ->', OUT)
