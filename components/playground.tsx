import { ArrowUpRight } from 'lucide-react';
import { PixelArt } from './pixel-art';
export function Brand({ small = false }: {
    small?: boolean;
}) { return <a className={`brand ${small ? 'small' : ''}`} href="/" aria-label="Playground home"><span className="brand-mark"><i /><i /><i /><i /><i /><i /></span><span>playground</span></a>; }
export function Label({ children }: {
    children: React.ReactNode;
}) { return <span className="eyebrow">{children}</span>; }
export function Pill({ children, tone = '' }: {
    children: React.ReactNode;
    tone?: string;
}) { return <span className={`pill ${tone}`}>{children}</span>; }
export function Landscape({ compact = false }: { compact?: boolean }) {
    return <div className={`landscape ${compact ? 'compact' : ''}`}><PixelArt scene="desk"/><div className="landscape-caption"><span className="signal"/> THE RESEARCH DESK <span>FIG. 01</span></div></div>;
}
export function MiniArt({ type = 0 }: { type?: number }) {
    return <div className={`mini-art art-${type}`}><PixelArt scene={(['archive', 'lab', 'people'] as const)[type % 3]}/></div>;
}
export function PublicHeader() { return <header className="public-header"><Brand /><nav aria-label="Main navigation"><a href="/#how-it-works">How it works</a><a href="/#intelligence">Intelligence</a><a href="/#pricing">Pricing</a></nav><a className="button dark small-button" href="/workspace">Open workspace <ArrowUpRight size={15}/></a></header>; }
export function PublicFooter() { return <footer className="public-footer"><div><Brand /><p>Research. Experiments. Human feedback.</p></div><div><a href="/workspace">Workspace <ArrowUpRight size={14}/></a><a href="/privacy">Privacy</a><a href="/terms">Pilot terms</a></div><span className="mono">© {new Date().getFullYear()} PLAYGROUND</span></footer>; }
