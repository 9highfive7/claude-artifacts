# レポート本文（<main> の中）を、段落・リスト・表のセルなどのブロックごとのテキストにして書き出す。
# yomiyasu のリンターに読ませるための補助スクリプト。図（svg）とコード（pre）は対象外。
# 使い方: python3 .claude/skills/report/extract_text.py reports/<slug>.html <出力先>.md
import re, sys, html
from html.parser import HTMLParser
BLOCK = {'p','li','td','th','figcaption','summary','h1','h2','h3','h4','caption','aside','span'}
class P(HTMLParser):
    def __init__(s): super().__init__(); s.out=[]; s.buf=''; s.skip=0; s.inmain=0
    def flush(s):
        t=re.sub(r'\s+',' ',s.buf).strip()
        if t: s.out.append(t)
        s.buf=''
    def handle_starttag(s,t,a):
        a=dict(a)
        if t=='main': s.inmain=1
        if t in ('svg','pre','style','script'): s.skip+=1
        if t in BLOCK and not (t=='span' and a.get('class')!='label'): s.flush()
        if t in ('strong','b'): s.buf+='**'
        if t=='code' and not s.skip: s.buf+='`'
    def handle_endtag(s,t):
        if t in ('svg','pre','style','script'): s.skip-=1; return
        if t in ('strong','b'): s.buf+='**'
        if t=='code' and not s.skip: s.buf+='`'
        if t in BLOCK: s.flush()
        if t=='main': s.flush(); s.inmain=0
    def handle_data(s,d):
        if s.inmain and not s.skip: s.buf+=d
src=open(sys.argv[1],encoding='utf-8').read()
p=P(); p.feed(src)
open(sys.argv[2],'w',encoding='utf-8').write('\n\n'.join(p.out)+'\n')
