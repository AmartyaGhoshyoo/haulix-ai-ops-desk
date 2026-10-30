"""Shared renderer for the agentic plan documents (HTML; printed to PDF by headless Chrome)."""
import html

def esc(s):
    # allow **bold** in content
    out = html.escape(s)
    parts = out.split("**")
    return "".join(f"<b>{p}</b>" if i % 2 else p for i, p in enumerate(parts))

def table(head, rows, cls=""):
    th = "".join(f"<th>{esc(h)}</th>" for h in head)
    tr = "".join("<tr>" + "".join(f"<td>{esc(c)}</td>" for c in r) + "</tr>" for r in rows)
    return f'<table class="{cls}"><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table>'

def bullets(items):
    return "<ul>" + "".join(f"<li>{esc(i)}</li>" for i in items) + "</ul>"

def para(*ps):
    return "".join(f"<p>{esc(p)}</p>" for p in ps)

def pre(s):
    return f"<pre>{html.escape(s)}</pre>"

def render(meta, sections, theme):
    toc = "".join(f'<li><span>{i+1:02d}</span>{esc(t)}</li>' for i, (t, _) in enumerate(sections))
    body = "".join(
        f'<section><h2><span class="n">{i+1:02d}</span>{esc(t)}</h2>{content}</section>'
        for i, (t, content) in enumerate(sections)
    )
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{esc(meta['title'])}</title>
<style>
@page {{ size: A4; margin: 18mm 16mm 18mm 16mm; }}
* {{ box-sizing: border-box; }}
body {{ font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1d1d1f; font-size: 10.5pt; line-height: 1.55; margin: 0; }}
.cover {{ height: 255mm; display: flex; flex-direction: column; justify-content: space-between; padding: 14mm; border-radius: 6mm;
  background: {theme['cover_bg']}; color: {theme['cover_ink']}; page-break-after: always; }}
.cover .kicker {{ font-size: 10pt; letter-spacing: .2em; text-transform: uppercase; color: {theme['accent_on_cover']}; font-weight: 700; }}
.cover h1 {{ font-size: 40pt; line-height: 1.02; margin: 8mm 0 4mm; letter-spacing: -.02em; }}
.cover .sub {{ font-size: 13pt; max-width: 130mm; opacity: .85; }}
.cover .foot {{ font-size: 9.5pt; opacity: .8; display:flex; justify-content: space-between; }}
.cover ol {{ list-style: none; padding: 0; margin: 0; columns: 2; font-size: 10pt; }}
.cover ol li {{ margin: 0 0 2mm; }} .cover ol span {{ color: {theme['accent_on_cover']}; font-weight: 700; margin-right: 3mm; }}
section {{ page-break-inside: auto; margin-bottom: 8mm; }}
h2 {{ font-size: 17pt; margin: 0 0 4mm; padding-top: 2mm; border-top: 2px solid {theme['accent']}; letter-spacing: -.01em; }}
h2 .n {{ color: {theme['accent']}; margin-right: 3mm; }}
h3 {{ font-size: 12pt; margin: 5mm 0 2mm; color: {theme['accent_dark']}; }}
p {{ margin: 0 0 3mm; }}
ul {{ margin: 0 0 3mm; padding-left: 5mm; }} li {{ margin-bottom: 1.2mm; }}
table {{ width: 100%; border-collapse: collapse; margin: 2mm 0 4mm; font-size: 9.2pt; page-break-inside: auto; }}
tr {{ page-break-inside: avoid; }}
th {{ text-align: left; background: {theme['th_bg']}; color: {theme['th_ink']}; padding: 2mm 2.4mm; font-weight: 700; }}
td {{ padding: 1.8mm 2.4mm; border-bottom: 1px solid #e6e6e6; vertical-align: top; }}
tbody tr:nth-child(even) td {{ background: #fafafa; }}
pre {{ background: #f4f4f5; border-radius: 2mm; padding: 3mm; font-size: 8.4pt; line-height: 1.45; white-space: pre-wrap; page-break-inside: avoid; }}
.callout {{ border-left: 3px solid {theme['accent']}; background: {theme['callout_bg']}; padding: 3mm 4mm; margin: 3mm 0 4mm; border-radius: 0 2mm 2mm 0; }}
.pill {{ display:inline-block; padding: .3mm 2mm; border-radius: 10mm; font-size: 8.4pt; font-weight: 700; }}
b {{ font-weight: 700; }}
</style></head><body>
<div class="cover">
  <div><div class="kicker">{esc(meta['kicker'])}</div><h1>{esc(meta['title'])}</h1><div class="sub">{esc(meta['subtitle'])}</div></div>
  <div><p style="font-weight:700;margin-bottom:3mm">Contents</p><ol>{toc}</ol></div>
  <div class="foot"><span>{esc(meta['by'])}</span><span>{esc(meta['date'])} · {esc(meta['status'])}</span></div>
</div>
{body}
</body></html>"""

def callout(s):
    return f'<div class="callout">{esc(s)}</div>'
