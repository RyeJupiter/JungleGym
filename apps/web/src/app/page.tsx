import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

// ── Naturalist illustrations — engraving / botanical plate style ──────────────
const K = "#c49660"   // warm amber ink
const D = "#9a7240"   // deeper sepia for hatching

// Left: seated gorilla, 3/4 right-facing, contemplative. After Brehm & Huxley.
function GorillaLeft() {
  return (
    <svg viewBox="0 0 155 275" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-32 xl:w-44 opacity-60">
      <ellipse cx="77" cy="270" rx="50" ry="5" fill={K} opacity="0.14"/>
      {/* seated legs */}
      <path d="M28 220 C22 238 34 254 56 258 C68 260 76 250 78 246 C80 250 88 260 100 258 C122 254 134 238 128 220" stroke={K} strokeWidth="1.6" fill={`${K}10`}/>
      <path d="M24 244 C20 257 30 266 44 265 C56 264 62 255 60 245" stroke={K} strokeWidth="1.2" fill={`${K}0c`}/>
      <path d="M132 244 C136 257 126 266 112 265 C100 264 94 255 96 245" stroke={K} strokeWidth="1.2" fill={`${K}0c`}/>
      <path d="M34 224 L28 240" stroke={D} strokeWidth="0.6" opacity="0.5"/><path d="M42 222 L36 238" stroke={D} strokeWidth="0.5" opacity="0.4"/>
      <path d="M118 222 L124 238" stroke={D} strokeWidth="0.6" opacity="0.5"/><path d="M110 224 L116 240" stroke={D} strokeWidth="0.5" opacity="0.4"/>
      {/* torso */}
      <path d="M32 172 C24 150 22 126 28 102 C36 78 52 70 66 68 C60 54 56 36 60 20 C64 8 74 3 86 3 C98 3 108 11 112 26 C116 42 112 58 106 72 C120 74 136 88 142 110 C148 134 146 160 138 182 C126 204 106 216 84 218 C60 220 44 200 32 172 Z" stroke={K} strokeWidth="1.8" fill={`${K}08`}/>
      {/* chest contour lines */}
      <path d="M54 118 Q86 110 118 118" stroke={D} strokeWidth="0.7" opacity="0.45"/>
      <path d="M52 126 Q86 118 120 126" stroke={D} strokeWidth="0.6" opacity="0.4"/>
      <path d="M54 134 Q86 126 118 134" stroke={D} strokeWidth="0.5" opacity="0.35"/>
      {/* shoulder masses */}
      <path d="M30 106 C18 98 14 112 20 124 C24 133 34 136 42 130" stroke={K} strokeWidth="1.3" fill={`${K}0a`}/>
      <path d="M126 104 C138 96 142 110 136 122 C132 131 122 134 114 128" stroke={K} strokeWidth="1.3" fill={`${K}0a`}/>
      {/* left arm */}
      <path d="M28 112 C16 128 12 158 16 186 C18 200 28 208 40 206 C52 204 56 192 54 178 C52 162 48 140 48 120" stroke={K} strokeWidth="1.5" fill={`${K}0c`}/>
      <path d="M14 196 C12 208 18 218 32 218 C46 218 56 210 54 202" stroke={K} strokeWidth="1.3" fill={`${K}10`}/>
      <path d="M18 206 L14 214" stroke={D} strokeWidth="0.6" opacity="0.5"/><path d="M26 210 L24 218" stroke={D} strokeWidth="0.6" opacity="0.5"/><path d="M34 212 L34 220" stroke={D} strokeWidth="0.6" opacity="0.5"/>
      {/* right arm */}
      <path d="M130 110 C142 126 146 156 142 184 C140 198 130 206 118 204 C106 202 102 192 104 178 C106 162 110 142 110 122" stroke={K} strokeWidth="1.5" fill={`${K}0c`}/>
      <path d="M144 194 C146 206 140 216 126 216 C112 216 102 210 104 202" stroke={K} strokeWidth="1.3" fill={`${K}10`}/>
      <path d="M140 204 L144 212" stroke={D} strokeWidth="0.6" opacity="0.5"/><path d="M132 208 L134 216" stroke={D} strokeWidth="0.6" opacity="0.5"/><path d="M124 210 L124 218" stroke={D} strokeWidth="0.6" opacity="0.5"/>
      {/* neck */}
      <path d="M64 70 C60 82 62 96 72 100 C80 98 90 94 90 84 C92 74 88 68 84 70" stroke={K} strokeWidth="1.3" fill={`${K}08`}/>
      <path d="M66 76 L64 90" stroke={D} strokeWidth="0.55" opacity="0.4"/><path d="M88 76 L90 88" stroke={D} strokeWidth="0.55" opacity="0.4"/>
      {/* cranium */}
      <path d="M58 20 C48 14 34 22 30 40 C26 56 32 74 44 84 C36 90 34 102 42 110 C50 120 66 124 82 124 C98 124 114 118 120 106 C128 94 124 80 116 74 C128 62 130 46 124 32 C118 18 104 8 88 10 C76 8 66 20 58 20 Z" stroke={K} strokeWidth="1.8" fill={`${K}0a`}/>
      {/* sagittal crest */}
      <path d="M68 10 C72 3 88 3 90 10" stroke={K} strokeWidth="1.3" fill="none"/>
      <path d="M71 9 L70 4" stroke={K} strokeWidth="0.5" opacity="0.4"/><path d="M77 7 L77 2" stroke={K} strokeWidth="0.5" opacity="0.4"/><path d="M83 8 L85 3" stroke={K} strokeWidth="0.5" opacity="0.4"/>
      {/* heavy brow ridge */}
      <path d="M34 58 C46 46 60 42 80 42 C100 42 114 48 122 58" stroke={K} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M36 61 C48 50 62 46 80 46 C98 46 112 52 120 61" stroke={D} strokeWidth="0.9" fill="none" opacity="0.45"/>
      <path d="M38 60 L34 70" stroke={D} strokeWidth="0.6" opacity="0.5"/><path d="M44 58 L40 68" stroke={D} strokeWidth="0.6" opacity="0.45"/>
      <path d="M118 58 L122 68" stroke={D} strokeWidth="0.6" opacity="0.5"/><path d="M112 58 L116 68" stroke={D} strokeWidth="0.6" opacity="0.45"/>
      {/* ears */}
      <path d="M32 74 C24 68 20 76 20 85 C20 94 26 102 34 100" stroke={K} strokeWidth="1.3" fill={`${K}0a`}/>
      <path d="M26 76 C23 82 24 91 28 96" stroke={D} strokeWidth="0.7" fill="none" opacity="0.5"/>
      <path d="M124 74 C132 68 136 76 136 85 C136 94 130 102 122 100" stroke={K} strokeWidth="1.3" fill={`${K}0a`}/>
      <path d="M130 76 C133 82 132 91 128 96" stroke={D} strokeWidth="0.7" fill="none" opacity="0.5"/>
      {/* muzzle */}
      <ellipse cx="80" cy="96" rx="33" ry="25" stroke={K} strokeWidth="1.5" fill={`${K}08`}/>
      {/* eyes — deep-set */}
      <ellipse cx="64" cy="68" rx="8" ry="6" stroke={K} strokeWidth="1" fill={`${D}35`}/>
      <circle cx="64" cy="68" r="4" fill={D} opacity="0.9"/>
      <circle cx="66" cy="67" r="1.5" fill="white" opacity="0.35"/>
      <path d="M58 65 Q64 62 70 65" stroke={D} strokeWidth="0.8" fill="none"/>
      <ellipse cx="96" cy="68" rx="8" ry="6" stroke={K} strokeWidth="1" fill={`${D}35`}/>
      <circle cx="96" cy="68" r="4" fill={D} opacity="0.9"/>
      <circle cx="98" cy="67" r="1.5" fill="white" opacity="0.35"/>
      <path d="M90 65 Q96 62 102 65" stroke={D} strokeWidth="0.8" fill="none"/>
      {/* nose */}
      <path d="M66 82 C62 86 62 94 68 96 C72 98 90 98 94 96 C100 94 100 86 96 82" stroke={K} strokeWidth="1.4" fill={`${D}14`}/>
      <ellipse cx="70" cy="92" rx="5" ry="3.5" stroke={D} strokeWidth="0.9" fill={`${D}28`}/>
      <ellipse cx="90" cy="92" rx="5" ry="3.5" stroke={D} strokeWidth="0.9" fill={`${D}28`}/>
      <path d="M80 96 L80 103" stroke={D} strokeWidth="0.7" opacity="0.4"/>
      {/* lips */}
      <path d="M60 106 C68 112 94 112 100 106" stroke={K} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M62 108 C70 114 90 114 98 108" stroke={D} strokeWidth="0.6" fill="none" opacity="0.4"/>
      {/* body shadow hatching */}
      <path d="M34 122 L26 144" stroke={D} strokeWidth="0.7" opacity="0.45"/><path d="M30 136 L22 158" stroke={D} strokeWidth="0.6" opacity="0.4"/><path d="M28 150 L22 170" stroke={D} strokeWidth="0.6" opacity="0.35"/>
      <path d="M126 120 L134 142" stroke={D} strokeWidth="0.7" opacity="0.45"/><path d="M130 134 L138 156" stroke={D} strokeWidth="0.6" opacity="0.4"/><path d="M132 148 L138 168" stroke={D} strokeWidth="0.6" opacity="0.35"/>
      <path d="M34 150 L28 156" stroke={D} strokeWidth="0.5" opacity="0.35"/><path d="M36 158 L30 164" stroke={D} strokeWidth="0.5" opacity="0.3"/>
      <path d="M122 152 L128 158" stroke={D} strokeWidth="0.5" opacity="0.35"/><path d="M120 160 L126 166" stroke={D} strokeWidth="0.5" opacity="0.3"/>
    </svg>
  )
}

// Right: seated gorilla, facing left, slightly more upright. Complementary plate.
function GorillaRight() {
  return (
    <svg viewBox="0 0 155 275" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-32 xl:w-44 opacity-60">
      <ellipse cx="78" cy="270" rx="50" ry="5" fill={K} opacity="0.14"/>
      {/* seated legs */}
      <path d="M28 218 C22 236 34 252 56 256 C68 258 76 248 78 244 C80 248 88 258 100 256 C122 252 134 236 128 218" stroke={K} strokeWidth="1.6" fill={`${K}10`}/>
      <path d="M24 242 C20 255 30 264 44 263 C56 262 62 253 60 243" stroke={K} strokeWidth="1.2" fill={`${K}0c`}/>
      <path d="M132 242 C136 255 126 264 112 263 C100 262 94 253 96 243" stroke={K} strokeWidth="1.2" fill={`${K}0c`}/>
      <path d="M34 222 L28 238" stroke={D} strokeWidth="0.6" opacity="0.5"/><path d="M42 220 L36 236" stroke={D} strokeWidth="0.5" opacity="0.4"/>
      <path d="M116 220 L122 236" stroke={D} strokeWidth="0.6" opacity="0.5"/><path d="M108 222 L114 238" stroke={D} strokeWidth="0.5" opacity="0.4"/>
      {/* torso — slightly more upright */}
      <path d="M30 168 C22 148 20 124 26 100 C34 76 50 68 64 66 C58 52 54 34 58 18 C62 6 72 1 86 1 C100 1 110 9 114 24 C118 40 114 56 108 70 C122 72 138 86 144 108 C150 132 148 158 140 180 C128 202 108 214 84 216 C60 218 42 198 30 168 Z" stroke={K} strokeWidth="1.8" fill={`${K}08`}/>
      <path d="M56 116 Q86 108 116 116" stroke={D} strokeWidth="0.7" opacity="0.45"/>
      <path d="M54 124 Q86 116 118 124" stroke={D} strokeWidth="0.6" opacity="0.4"/>
      <path d="M56 132 Q86 124 116 132" stroke={D} strokeWidth="0.5" opacity="0.35"/>
      <path d="M28 104 C16 96 12 110 18 122 C22 131 32 134 40 128" stroke={K} strokeWidth="1.3" fill={`${K}0a`}/>
      <path d="M128 102 C140 94 144 108 138 120 C134 129 124 132 116 126" stroke={K} strokeWidth="1.3" fill={`${K}0a`}/>
      {/* arms */}
      <path d="M26 110 C14 126 10 156 14 184 C16 198 26 206 38 204 C50 202 54 190 52 176 C50 160 46 138 46 118" stroke={K} strokeWidth="1.5" fill={`${K}0c`}/>
      <path d="M12 192 C10 204 16 214 30 214 C44 214 54 206 52 198" stroke={K} strokeWidth="1.3" fill={`${K}10`}/>
      <path d="M16 202 L12 210" stroke={D} strokeWidth="0.6" opacity="0.5"/><path d="M24 206 L22 214" stroke={D} strokeWidth="0.6" opacity="0.5"/><path d="M32 208 L32 216" stroke={D} strokeWidth="0.6" opacity="0.5"/>
      <path d="M130 108 C142 124 146 154 142 182 C140 196 130 204 118 202 C106 200 102 190 104 176 C106 160 110 140 110 120" stroke={K} strokeWidth="1.5" fill={`${K}0c`}/>
      <path d="M144 190 C146 202 140 212 126 212 C112 212 102 206 104 198" stroke={K} strokeWidth="1.3" fill={`${K}10`}/>
      <path d="M140 200 L144 208" stroke={D} strokeWidth="0.6" opacity="0.5"/><path d="M132 204 L134 212" stroke={D} strokeWidth="0.6" opacity="0.5"/><path d="M124 206 L124 214" stroke={D} strokeWidth="0.6" opacity="0.5"/>
      {/* neck */}
      <path d="M62 68 C58 80 60 94 70 98 C78 96 88 92 88 82 C90 72 86 66 82 68" stroke={K} strokeWidth="1.3" fill={`${K}08`}/>
      <path d="M64 74 L62 88" stroke={D} strokeWidth="0.55" opacity="0.4"/><path d="M86 74 L88 86" stroke={D} strokeWidth="0.55" opacity="0.4"/>
      {/* cranium — head tilted slightly upward */}
      <path d="M56 18 C46 12 32 20 28 38 C24 54 30 72 42 82 C34 88 32 100 40 108 C48 118 64 122 82 122 C100 122 116 116 122 104 C130 92 126 78 118 72 C130 60 132 44 126 30 C120 16 106 6 90 8 C78 6 64 18 56 18 Z" stroke={K} strokeWidth="1.8" fill={`${K}0a`}/>
      <path d="M66 8 C70 1 88 1 90 8" stroke={K} strokeWidth="1.3" fill="none"/>
      <path d="M69 7 L68 2" stroke={K} strokeWidth="0.5" opacity="0.4"/><path d="M75 5 L75 0" stroke={K} strokeWidth="0.5" opacity="0.4"/><path d="M81 6 L83 1" stroke={K} strokeWidth="0.5" opacity="0.4"/>
      {/* heavy brow ridge */}
      <path d="M32 56 C44 44 58 40 80 40 C102 40 116 46 122 56" stroke={K} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M34 59 C46 48 60 44 80 44 C100 44 114 50 120 59" stroke={D} strokeWidth="0.9" fill="none" opacity="0.45"/>
      <path d="M36 58 L32 68" stroke={D} strokeWidth="0.6" opacity="0.5"/><path d="M42 56 L38 66" stroke={D} strokeWidth="0.6" opacity="0.45"/>
      <path d="M118 56 L122 66" stroke={D} strokeWidth="0.6" opacity="0.5"/><path d="M112 56 L116 66" stroke={D} strokeWidth="0.6" opacity="0.45"/>
      {/* ears */}
      <path d="M30 72 C22 66 18 74 18 83 C18 92 24 100 32 98" stroke={K} strokeWidth="1.3" fill={`${K}0a`}/>
      <path d="M24 74 C21 80 22 89 26 94" stroke={D} strokeWidth="0.7" fill="none" opacity="0.5"/>
      <path d="M122 72 C130 66 134 74 134 83 C134 92 128 100 120 98" stroke={K} strokeWidth="1.3" fill={`${K}0a`}/>
      <path d="M128 74 C131 80 130 89 126 94" stroke={D} strokeWidth="0.7" fill="none" opacity="0.5"/>
      {/* muzzle */}
      <ellipse cx="80" cy="94" rx="33" ry="25" stroke={K} strokeWidth="1.5" fill={`${K}08`}/>
      {/* eyes */}
      <ellipse cx="64" cy="66" rx="8" ry="6" stroke={K} strokeWidth="1" fill={`${D}35`}/>
      <circle cx="64" cy="66" r="4" fill={D} opacity="0.9"/>
      <circle cx="66" cy="65" r="1.5" fill="white" opacity="0.35"/>
      <path d="M58 63 Q64 60 70 63" stroke={D} strokeWidth="0.8" fill="none"/>
      <ellipse cx="96" cy="66" rx="8" ry="6" stroke={K} strokeWidth="1" fill={`${D}35`}/>
      <circle cx="96" cy="66" r="4" fill={D} opacity="0.9"/>
      <circle cx="98" cy="65" r="1.5" fill="white" opacity="0.35"/>
      <path d="M90 63 Q96 60 102 63" stroke={D} strokeWidth="0.8" fill="none"/>
      {/* nose */}
      <path d="M66 80 C62 84 62 92 68 94 C72 96 90 96 94 94 C100 92 100 84 96 80" stroke={K} strokeWidth="1.4" fill={`${D}14`}/>
      <ellipse cx="70" cy="90" rx="5" ry="3.5" stroke={D} strokeWidth="0.9" fill={`${D}28`}/>
      <ellipse cx="90" cy="90" rx="5" ry="3.5" stroke={D} strokeWidth="0.9" fill={`${D}28`}/>
      <path d="M80 94 L80 101" stroke={D} strokeWidth="0.7" opacity="0.4"/>
      {/* lips */}
      <path d="M60 104 C68 110 94 110 100 104" stroke={K} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M62 106 C70 112 90 112 98 106" stroke={D} strokeWidth="0.6" fill="none" opacity="0.4"/>
      {/* body shadow hatching */}
      <path d="M32 120 L24 142" stroke={D} strokeWidth="0.7" opacity="0.45"/><path d="M28 134 L20 156" stroke={D} strokeWidth="0.6" opacity="0.4"/><path d="M26 148 L20 168" stroke={D} strokeWidth="0.6" opacity="0.35"/>
      <path d="M126 118 L134 140" stroke={D} strokeWidth="0.7" opacity="0.45"/><path d="M130 132 L138 154" stroke={D} strokeWidth="0.6" opacity="0.4"/><path d="M132 146 L138 166" stroke={D} strokeWidth="0.6" opacity="0.35"/>
      <path d="M32 148 L26 154" stroke={D} strokeWidth="0.5" opacity="0.35"/><path d="M34 156 L28 162" stroke={D} strokeWidth="0.5" opacity="0.3"/>
      <path d="M120 150 L126 156" stroke={D} strokeWidth="0.5" opacity="0.35"/><path d="M118 158 L124 164" stroke={D} strokeWidth="0.5" opacity="0.3"/>
    </svg>
  )
}

// Wide landscape plate: monkey on a branch. After 19th-c. natural history engravings.
function MonkeyOnBranch() {
  return (
    <svg viewBox="0 0 400 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full max-w-sm opacity-55">
      {/* === BRANCH === */}
      <path d="M0 112 C50 106 100 100 150 103 C200 106 240 99 290 96 C330 93 360 94 400 98" stroke={K} strokeWidth="7" fill="none" strokeLinecap="round"/>
      <path d="M10 111 C60 106 110 101 160 104" stroke={D} strokeWidth="1" fill="none" opacity="0.45"/>
      <path d="M170 103 C220 100 260 97 300 95" stroke={D} strokeWidth="1" fill="none" opacity="0.4"/>
      <path d="M10 115 C60 110 120 105 170 108" stroke={D} strokeWidth="0.7" fill="none" opacity="0.4"/>
      {/* bark texture */}
      <path d="M60 108 L58 114" stroke={D} strokeWidth="0.6" opacity="0.4"/><path d="M90 106 L88 112" stroke={D} strokeWidth="0.6" opacity="0.4"/>
      <path d="M200 103 L198 109" stroke={D} strokeWidth="0.6" opacity="0.4"/><path d="M340 96 L338 102" stroke={D} strokeWidth="0.6" opacity="0.4"/>
      {/* small side branches */}
      <path d="M110 102 C105 88 108 74 114 65" stroke={K} strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M113 102 C108 89 111 76 117 67" stroke={D} strokeWidth="0.8" fill="none" opacity="0.4"/>
      <path d="M330 95 C335 80 338 65 332 55" stroke={K} strokeWidth="2.8" fill="none" strokeLinecap="round"/>
      <path d="M333 95 C338 81 341 67 335 57" stroke={D} strokeWidth="0.8" fill="none" opacity="0.4"/>
      {/* === FOLIAGE === */}
      {/* left branch leaves */}
      <path d="M114 65 C108 54 98 50 92 57 C86 64 92 74 102 72 C110 70 114 65 114 65 Z" stroke={K} strokeWidth="1.2" fill={`${K}0a`}/>
      <path d="M114 65 C120 54 130 48 138 54 C146 60 144 72 134 74 C124 76 116 66 114 65 Z" stroke={K} strokeWidth="1.2" fill={`${K}0a`}/>
      <path d="M114 65 C110 52 116 40 126 38 C136 36 142 46 136 55" stroke={K} strokeWidth="1.1" fill={`${K}08`}/>
      <path d="M96 60 C100 65 106 70 112 70" stroke={D} strokeWidth="0.5" fill="none" opacity="0.5"/>
      <path d="M126 50 C126 57 128 64 132 68" stroke={D} strokeWidth="0.5" fill="none" opacity="0.5"/>
      {/* right branch leaves */}
      <path d="M332 55 C326 44 314 40 308 47 C302 54 308 64 318 62 C328 60 332 55 332 55 Z" stroke={K} strokeWidth="1.2" fill={`${K}0a`}/>
      <path d="M332 55 C338 44 350 38 358 44 C366 50 364 62 354 64 C344 66 334 56 332 55 Z" stroke={K} strokeWidth="1.2" fill={`${K}0a`}/>
      <path d="M316 48 C320 54 326 60 330 60" stroke={D} strokeWidth="0.5" fill="none" opacity="0.5"/>
      <path d="M346 40 C346 48 348 55 352 59" stroke={D} strokeWidth="0.5" fill="none" opacity="0.5"/>
      {/* === MONKEY (center-right, perched ~x 205-240) === */}
      {/* tail - long, hanging and curling */}
      <path d="M232 100 C236 116 240 132 246 142 C252 152 262 154 267 146 C272 136 266 122 254 118" stroke={K} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M234 102 C238 116 242 132 248 142" stroke={D} strokeWidth="0.7" fill="none" opacity="0.4"/>
      {/* haunches/hind legs on branch */}
      <path d="M210 100 C206 106 205 115 210 119 C216 123 224 121 226 114 C228 107 222 100 216 98" stroke={K} strokeWidth="1.4" fill={`${K}0e`}/>
      <path d="M228 98 C234 103 236 112 231 117 C226 122 218 120 216 114" stroke={K} strokeWidth="1.4" fill={`${K}0e`}/>
      {/* body */}
      <path d="M206 78 C199 84 197 96 201 104 C206 112 218 116 230 112 C240 108 245 96 239 88 C233 80 218 74 210 76 C208 76 206 78 206 78 Z" stroke={K} strokeWidth="1.6" fill={`${K}0c`}/>
      <path d="M204 86 C208 84 214 82 221 82" stroke={D} strokeWidth="0.6" fill="none" opacity="0.45"/>
      <path d="M202 93 C207 91 214 89 222 89" stroke={D} strokeWidth="0.6" fill="none" opacity="0.4"/>
      <path d="M203 100 C208 98 215 96 224 96" stroke={D} strokeWidth="0.5" fill="none" opacity="0.35"/>
      <path d="M202 82 L198 92" stroke={D} strokeWidth="0.7" opacity="0.45"/><path d="M200 90 L196 100" stroke={D} strokeWidth="0.6" opacity="0.4"/>
      <path d="M240 80 L244 90" stroke={D} strokeWidth="0.7" opacity="0.45"/><path d="M242 88 L246 98" stroke={D} strokeWidth="0.6" opacity="0.4"/>
      {/* arms gripping branch */}
      <path d="M204 82 C196 88 192 100 195 108 C198 114 205 113 207 108" stroke={K} strokeWidth="1.3" fill={`${K}0c`}/>
      <path d="M194 106 C191 110 193 118 198 120 C204 122 209 118 208 112" stroke={K} strokeWidth="1.1" fill={`${K}0c`}/>
      <path d="M236 76 C244 80 248 92 244 100 C241 107 234 106 232 100" stroke={K} strokeWidth="1.3" fill={`${K}0c`}/>
      <path d="M244 98 C249 102 250 110 246 114 C241 118 235 115 234 108" stroke={K} strokeWidth="1.1" fill={`${K}0c`}/>
      {/* neck */}
      <path d="M212 74 C210 66 213 59 220 57 C227 55 233 59 232 67 C232 74 228 76 224 76" stroke={K} strokeWidth="1.2" fill={`${K}0a`}/>
      {/* head */}
      <path d="M208 44 C200 38 192 42 190 52 C188 60 193 72 202 78 C210 84 226 84 234 78 C242 72 244 58 238 50 C232 42 220 40 212 42 Z" stroke={K} strokeWidth="1.6" fill={`${K}0a`}/>
      {/* brow */}
      <path d="M194 54 C200 47 210 44 222 48 C230 50 236 56 234 61" stroke={K} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M196 57 C202 51 212 48 222 52" stroke={D} strokeWidth="0.7" fill="none" opacity="0.4"/>
      {/* ears */}
      <path d="M192 56 C185 52 181 59 183 67 C185 74 192 78 197 74" stroke={K} strokeWidth="1.1" fill={`${K}08`}/>
      <path d="M236 54 C242 50 246 57 244 65 C242 72 236 76 231 72" stroke={K} strokeWidth="1.1" fill={`${K}08`}/>
      {/* muzzle — narrow, primate */}
      <ellipse cx="218" cy="64" rx="17" ry="14" stroke={K} strokeWidth="1.2" fill={`${K}08`}/>
      {/* eyes */}
      <ellipse cx="206" cy="56" rx="5" ry="4" stroke={K} strokeWidth="0.9" fill={`${D}38`}/>
      <circle cx="206" cy="56" r="2.5" fill={D} opacity="0.9"/>
      <circle cx="207" cy="55" r="1" fill="white" opacity="0.4"/>
      <path d="M201 53 Q206 51 211 54" stroke={D} strokeWidth="0.7" fill="none"/>
      <ellipse cx="230" cy="56" rx="5" ry="4" stroke={K} strokeWidth="0.9" fill={`${D}38`}/>
      <circle cx="230" cy="56" r="2.5" fill={D} opacity="0.9"/>
      <circle cx="231" cy="55" r="1" fill="white" opacity="0.4"/>
      <path d="M225 53 Q230 51 235 54" stroke={D} strokeWidth="0.7" fill="none"/>
      {/* nose */}
      <ellipse cx="214" cy="64" rx="3.5" ry="2.5" stroke={D} strokeWidth="0.8" fill={`${D}25`}/>
      <ellipse cx="222" cy="64" rx="3.5" ry="2.5" stroke={D} strokeWidth="0.8" fill={`${D}25`}/>
      {/* mouth */}
      <path d="M208 72 C215 77 224 77 230 72" stroke={K} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* face hatching */}
      <path d="M196 52 L194 58" stroke={D} strokeWidth="0.5" opacity="0.45"/><path d="M238 52 L240 58" stroke={D} strokeWidth="0.5" opacity="0.45"/>
    </svg>
  )
}

export default async function HomePage() {
  return (
    <div className="min-h-screen">

      <Navbar />

      {/* Hero */}
      <div className="bg-jungle-800">
        <section className="pt-28 pb-24 px-6 text-center relative overflow-hidden">

          {/* Gorilla decorations */}
          <div className="hidden lg:block absolute left-4 xl:left-10 bottom-0 pointer-events-none select-none">
            <GorillaLeft />
          </div>
          <div className="hidden lg:block absolute right-4 xl:right-10 bottom-0 pointer-events-none select-none">
            <GorillaRight />
          </div>

          <div className="max-w-3xl mx-auto relative z-10">
            <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-white mb-6 leading-none" style={{ textShadow: '-1px -1px 0 rgba(0,0,0,0.25), 1px -1px 0 rgba(0,0,0,0.25), -1px 1px 0 rgba(0,0,0,0.25), 1px 1px 0 rgba(0,0,0,0.25)' }}>
              Welcome to JungleGym.
              <br />
              <span className="block mt-3 text-jungle-400">Let&apos;s learn &amp; play.</span>
            </h1>
            <p className="text-lg text-jungle-300 mb-10 max-w-xl mx-auto leading-relaxed">
              Movement classes from skilled guides.
              Every class leaves you with something your body didn't have before.
            </p>
            {/* Tag pills — one row, content categories */}
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {[
                ['yoga',       '🧘', 'yoga'],
                ['strength',   '💪', 'strength'],
                ['mobility',   '🌀', 'mobility'],
                ['breathwork', '🌬️', 'breathwork'],
                ['dance',      '💃', 'dance'],
                ['kettlebell', '🔔', 'kettlebell'],
              ].map(([slug, emoji, label]) => (
                <Link
                  key={slug}
                  href={`/classes?tag=${slug}`}
                  className="flex items-center gap-1.5 bg-jungle-700/40 hover:bg-jungle-600/60 border border-jungle-500/40 hover:border-jungle-400/80 text-jungle-200 hover:text-white px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
                >
                  <span className="text-base leading-none">{emoji}</span>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How it works — quick 3-step */}
        <section className="pb-20 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {[
              { emoji: '🔍', title: 'Find a teacher', body: 'Browse by style — yoga, kettlebell, mobility, breathwork, and more.', href: '/classes' },
              { emoji: '🎬', title: 'Watch & train', body: 'Buy videos from curated guides. 80% to the teacher, 20% to JungleGym.', href: '/classes' },
              { emoji: '🎁', title: 'Join live sessions', body: 'Real-time classes, gift-based.', href: '/sessions' },
            ].map((step) => (
              <Link key={step.title} href={step.href} className="bg-jungle-800/60 hover:bg-jungle-700/80 rounded-2xl p-6 border border-jungle-700 hover:border-jungle-500 transition-colors block">
                <div className="text-4xl mb-3">{step.emoji}</div>
                <h3 className="font-bold text-white mb-1">{step.title}</h3>
                <p className="text-jungle-400 text-sm leading-relaxed">{step.body}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Pricing — fun & transparent */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-jungle-500 uppercase tracking-widest mb-3">Radical Transparency</p>
            <h2 className="text-4xl font-black text-stone-900 mb-3">Buy classes from lovers of movement.</h2>
            <p className="text-stone-600 max-w-xl mx-auto text-lg">
              Choose your tier. 80% goes directly to the teacher, 20% to JungleGym.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { emoji: '🌱', tier: 'Supported', bg: 'bg-stone-50', border: 'border-stone-200' },
              { emoji: '🌿', tier: 'Community', bg: 'bg-jungle-50', border: 'border-jungle-200' },
              { emoji: '🌳', tier: 'Abundance', bg: 'bg-jungle-100', border: 'border-jungle-300' },
            ].map((t) => (
              <div key={t.tier} className={`${t.bg} border ${t.border} rounded-2xl p-8 text-center`}>
                <div className="text-4xl mb-4">{t.emoji}</div>
                <h3 className="font-black text-stone-900 text-xl">{t.tier}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy blurb */}
      <section className="py-20 px-6 bg-jungle-900 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center mb-6">
            <MonkeyOnBranch />
          </div>
          <p className="text-jungle-400 text-sm font-semibold uppercase tracking-widest mb-3">The oldest wisdom</p>
          <h2 className="text-4xl font-black text-white mb-4">Monkey see. Monkey do.</h2>
          <p className="text-jungle-300 text-lg leading-relaxed mb-8">
            Mimicry is the oldest way to learn — and JungleGym is built on that idea.
            Watch someone move with ease, and your body starts to understand.
            Vetted teachers who move clearly, so you can read them and grow.
          </p>
          <Link
            href="/auth/signup"
            className="bg-earth-400 hover:bg-earth-500 text-white font-bold px-10 py-4 rounded-xl text-lg inline-block transition-colors"
          >
            Join free — no credit card needed
          </Link>
        </div>
      </section>

      {/* Live sessions */}
      <section className="py-14 px-6 bg-stone-50 border-t border-stone-200">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-stone-900 mb-1">Want a workout with a little magic in it?</h2>
            <p className="text-stone-600 text-sm leading-relaxed">Live classes let you move alongside a real guide, ask questions mid-practice, and get the kind of personalization you just can&apos;t get from a recording. Find a class that&apos;s calling your name — and show up.</p>
          </div>
          <Link href="/sessions" className="shrink-0 bg-jungle-800 hover:bg-jungle-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors whitespace-nowrap">
            Join a live class →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
