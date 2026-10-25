import { useId } from 'react';

type Scene = 'desk' | 'archive' | 'lab' | 'people' | 'quibi' | 'juicero' | 'stadia' | 'fast';

// Original vector illustrations. Drawn on a four-pixel grid, with a printed halftone finish.
// Decorative: the adjacent headings and descriptions carry the meaning.
export function PixelArt({ scene = 'desk', className = '' }: { scene?: Scene; className?: string }) {
  const id = useId().replace(/:/g, '');
  const blue = '#6f8fb8', ink = '#202c3d', paper = '#fffdf5', orange = '#ff4500';
  return <svg className={`pixel-art pixel-${scene} ${className}`} viewBox="0 0 400 250" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <pattern id={`${id}-grid`} width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" stroke="#8fa9c6" strokeWidth=".5" opacity=".32" /></pattern>
      <pattern id={`${id}-tone`} width="4" height="4" patternUnits="userSpaceOnUse"><rect width="1.3" height="1.3" fill={ink} opacity=".4" /></pattern>
    </defs>
    <rect width="400" height="250" fill={scene === 'juicero' ? '#e8eddf' : scene === 'quibi' ? '#e9e5f0' : scene === 'fast' ? '#ede9df' : '#e1e9f2'} />
    <rect width="400" height="250" fill={`url(#${id}-grid)`} />
    <path d="M16 24h12m-6-6v12M372 226h12m-6-6v12" stroke={blue} />
    <g shapeRendering="crispEdges">
      <path d="M62 215h276v8H62zM86 207h228v8H86z" fill={blue} opacity=".18" />
      {scene === 'desk' && <>
        <path d="M108 47h176v12h12v120H96V59h12z" fill={ink}/><path d="M108 51h168v120H104V59h4z" fill={paper}/>
        <path d="M120 65h140v88H120z" fill={blue}/><path d="M128 73h124v72H128z" fill="#d9e8f0"/>
        <path d="m128 129 24-24 16 12 28-36 28 32 12-8 16 24v16H128z" fill="#8eabc6"/>
        <path d="m128 145 36-24 24 12 24-16 40 28z" fill="#476a91"/>
        <path d="M198 118V80h4v38zM202 80h30l-8 8 8 8h-30z" fill={orange}/>
        <path d="M164 179h64v16h12v8h-88v-8h12z" fill={ink}/><path d="M168 179h52v12h-52z" fill={blue}/>
        <path d="M100 202h152l20 20H80z" fill={paper} stroke={ink} strokeWidth="4"/>
        {Array.from({length: 12}, (_, i) => <rect key={i} x={107+i*11} y="207" width="7" height="5" fill={blue}/>)}
        <path d="M290 140h44v58h-44zM334 150h12v28h-12" stroke={ink} strokeWidth="4" fill={paper}/><path d="M296 160h32v30h-32z" fill={orange}/>
        <path d="M54 92h28v4H54zM66 80h4v28h-4z" fill={orange}/>
        <rect x="264" y="59" width="12" height="112" fill={`url(#${id}-tone)`}/>
      </>}
      {scene === 'archive' && <>
        <path d="M104 50h180v160H104z" fill={ink}/><path d="M108 50h164v152H108z" fill={paper}/>
        {[62,108,154].map((y,i)=><g key={y}><rect x="120" y={y} width="140" height="38" fill={i===1?'#b8cbe2':'#e1e9f2'} stroke={blue} strokeWidth="2"/><path d={`M174 ${y+14}h32v10h-32z`} fill={paper} stroke={ink} strokeWidth="2"/></g>)}
        <path d="M78 84h72v100H78z" fill={orange}/><path d="M86 92h56v84H86z" fill="#fff1e2"/>
        <path d="M94 106h36v4H94zM94 118h24v4H94zM94 130h32v4H94z" fill={orange}/>
        <path d="M252 132h40v8h12v40h-12v12h-40v-12h-12v-40h12z" fill={ink}/><path d="M256 140h32v8h8v28h-8v8h-32v-8h-8v-28h8z" fill="#b9d9ed"/>
        <path d="m288 184 32 32 12-12-32-32z" fill={orange}/><rect x="108" y="50" width="12" height="152" fill={`url(#${id}-tone)`}/>
      </>}
      {scene === 'lab' && <>
        <path d="M106 62h184v140H106z" fill={paper} stroke={ink} strokeWidth="4"/><path d="M106 62h184v20H106z" fill={blue}/>
        <path d="M118 69h5v5h-5zM128 69h5v5h-5zM138 69h5v5h-5z" fill={paper}/>
        <path d="M168 100h44v8h-8v36l28 40v8h-84v-8l28-40v-36h-8z" fill="#c6d8e8" stroke={ink} strokeWidth="4"/>
        <path d="M170 160h40l16 24h-72z" fill={orange}/><path d="M182 126h8v8h-8zM194 148h4v4h-4z" fill={paper}/>
        <path d="M266 140h48v48h-48z" fill={orange}/><path d="m276 162 10 10 18-20" stroke={paper} strokeWidth="6"/>
        <path d="M70 126h20v4H70zM78 118h4v20h-4z" fill={blue}/>
        <rect x="112" y="88" width="12" height="108" fill={`url(#${id}-tone)`}/>
      </>}
      {scene === 'people' && <>
        <path d="M198 78v100M110 178h176M110 150v28M286 150v28" stroke={blue} strokeWidth="2" strokeDasharray="4 4"/>
        {[{x:66,y:104,c:'#d3dfed'},{x:244,y:104,c:'#f0e2cc'},{x:154,y:28,c:'#ffdac5'}].map(({x,y,c})=><g key={x}><path d={`M${x+6} ${y+6}h80v82h-80z`} fill={ink}/><rect x={x} y={y} width="80" height="82" fill={paper} stroke={blue} strokeWidth="2"/><rect x={x+6} y={y+6} width="68" height="68" fill={c}/><path d={`M${x+28} ${y+18}h24v24h-24zM${x+20} ${y+42}h40v24h-40z`} fill={ink}/><path d={`M${x+28} ${y+46}h24v20h-24z`} fill={x===154?orange:blue}/><rect x={x+34} y={y+22} width="12" height="16" fill="#e0b79b"/></g>)}
        <path d="M178 186h40v28h-40z" fill={orange}/><path d="m187 199 7 7 13-14" stroke={paper} strokeWidth="4"/>
      </>}
      {scene === 'quibi' && <>
        <path d="M160 30h80v8h8v172h-8v8h-80v-8h-8V38h8z" fill={ink}/><path d="M160 46h80v152h-80z" fill={paper}/><path d="M166 64h68v104h-68z" fill="#9aa7c1"/>
        <path d="M166 148 194 108l16 20 24-40v80h-68z" fill="#526e9e"/><path d="m191 100 24 16-24 16z" fill={orange}/><path d="M184 36h32v4h-32zM190 204h20v4h-20z" fill={paper}/>
        <path d="M270 76h24v4h-24zM280 66h4v24h-4zM108 152h20v4h-20z" fill={blue}/>
      </>}
      {scene === 'juicero' && <>
        <path d="M142 38h112v12h8v148H134V50h8z" fill={ink}/><path d="M142 42h108v148H142z" fill={paper}/><path d="M156 60h80v68h-80z" fill="#c0ccae"/>
        <path d="M170 74h52v40h-52z" fill="#7f916a"/><path d="M186 82h20v24h-20z" fill={orange}/><path d="M158 144h76v42h-76z" fill={ink}/><path d="M180 144h32l-4 40h-24z" fill="#ffe3bb"/><path d="M184 158h24v22h-24z" fill={orange}/><path d="M134 198h128v8H134z" fill={blue}/><rect x="238" y="50" width="12" height="138" fill={`url(#${id}-tone)`}/>
      </>}
      {scene === 'stadia' && <>
        <path d="M150 102h100v8h32v12h12v16h8v48h-8v12h-32l-28-28h-68l-28 28h-32v-12H98v-48h8v-16h12v-12h32z" fill={ink}/>
        <path d="M150 106h100v8h28v12h12v16h8v40h-12v8h-22l-28-28h-72l-28 28h-22v-8h-12v-40h8v-16h12v-12h28z" fill={paper}/>
        <path d="M138 126h12v12h12v12h-12v12h-12v-12h-12v-12h12z" fill={ink}/><path d="M256 126h8v8h-8zM272 140h8v8h-8zM240 140h8v8h-8zM256 154h8v8h-8z" fill={orange}/>
        <path d="M180 62h40v-8h16v-8h-16V38h-40v8h-16v8h16z" fill={blue}/><path d="M198 70v20" stroke={blue} strokeWidth="2" strokeDasharray="4 4"/>
      </>}
      {scene === 'fast' && <>
        <path d="M108 54h192v142H108z" fill={ink}/><path d="M104 48h188v140H104z" fill={paper} stroke={ink} strokeWidth="4"/><path d="M106 50h184v20H106z" fill={blue}/>
        <path d="M116 57h5v5h-5zM126 57h5v5h-5zM136 57h5v5h-5z" fill={paper}/>
        <path d="M124 90h50v50h-50z" fill="#d7e2ed"/><path d="M186 94h80v6h-80zM186 108h52v4h-52zM124 154h142v20H124z" fill={blue}/>
        <path d="m226 120-22 34h18l-8 30 34-42h-20l10-22z" fill={orange}/><path d="m272 178 28 20-14 4-6 14z" fill={ink}/>
      </>}
    </g>
    <path d="M28 230h48m-48-4v8m48-8v8" stroke={blue} strokeWidth=".8"/>
  </svg>;
}
