type SupportIllustrationProps = {
  slug: string;
  className?: string;
  showNumber?: boolean;
};

export default function SupportIllustration({
  slug,
  className = "",
  showNumber = true,
}: SupportIllustrationProps) {
  const numberBySlug: Record<string, string> = {
    anxiety: "01",
    depression: "02",
    relationships: "03",
    trauma: "04",
    "stress-burnout": "05",
    "self-esteem": "06",
    ocd: "07",
    grief: "08",
    parenting: "09",
    "eating-disorders": "10",
  };

  const number = numberBySlug[slug] ?? "01";

  return (
    <div
      className={`relative h-full min-h-[320px] w-full overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {showNumber && (
        <span className="absolute left-7 top-6 z-20 text-xs font-bold tracking-[0.3em] text-[#415a72]/55">
          {number}
        </span>
      )}

      {slug === "anxiety" && <AnxietyIllustration />}
      {slug === "depression" && <DepressionIllustration />}
      {slug === "relationships" && <RelationshipsIllustration />}
      {slug === "trauma" && <TraumaIllustration />}
      {slug === "stress-burnout" && <BurnoutIllustration />}
      {slug === "self-esteem" && <SelfEsteemIllustration />}
      {slug === "ocd" && <OCDIllustration />}
      {slug === "grief" && <GriefIllustration />}
      {slug === "parenting" && <ParentingIllustration />}
      {slug === "eating-disorders" && <EatingIllustration />}
    </div>
  );
}

function AnxietyIllustration() {
  return (
    <div className="absolute inset-0 bg-[#dce7df]">
      <div className="absolute left-[10%] top-[19%] h-[67%] w-[76%] rounded-[55%_45%_60%_40%/48%_58%_42%_52%] bg-[#9aaa9c]/50" />

      <div className="absolute left-[25%] top-[33%] h-[40%] w-[45%] rounded-full bg-[#7d9183]/35" />

      <svg
        viewBox="0 0 500 500"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <path
          d="M115 270C155 185 330 182 352 269C366 323 304 350 248 326C190 302 177 221 255 211C326 201 365 269 320 316C273 365 179 324 178 258C177 206 259 180 316 222C362 256 343 329 281 347C214 367 151 315 162 250"
          stroke="#415a72"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />

        <path
          d="M94 241C142 331 310 370 379 274"
          stroke="#415a72"
          strokeWidth="1.5"
          opacity="0.35"
        />

        <circle
          cx="390"
          cy="105"
          r="42"
          stroke="white"
          strokeWidth="2"
          opacity="0.8"
        />

        <circle cx="92" cy="394" r="22" fill="#718a76" />
      </svg>
    </div>
  );
}

function DepressionIllustration() {
  return (
    <div className="absolute inset-0 bg-[#e1e5ec]">
      <svg
        viewBox="0 0 500 500"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <path
          d="M0 180C70 225 124 277 190 324C270 382 356 396 500 367V500H0V180Z"
          fill="#8190a5"
        />

        <path
          d="M0 237C93 284 150 354 233 388C323 425 409 414 500 397V500H0V237Z"
          fill="#667890"
          opacity="0.9"
        />

        <path
          d="M0 310C94 346 164 422 254 438C330 451 407 437 500 412V500H0V310Z"
          fill="#4f6179"
          opacity="0.95"
        />

        <circle cx="384" cy="112" r="36" fill="#c9d0dc" />

        <path
          d="M55 154C173 210 237 301 449 335"
          stroke="#95a2b5"
          strokeWidth="2"
          opacity="0.7"
        />

        <path
          d="M245 379C254 345 277 324 305 324C334 324 353 348 353 379"
          fill="#25384c"
        />

        <circle cx="304" cy="309" r="17" fill="#25384c" />
      </svg>
    </div>
  );
}

function RelationshipsIllustration() {
  return (
    <div className="absolute inset-0 bg-[#eee0d6]">
      <div className="absolute -left-[8%] top-[20%] h-[70%] w-[58%] rounded-[48%_52%_60%_40%/62%_48%_52%_38%] bg-[#d7b593]" />

      <div className="absolute -right-[8%] top-[13%] h-[78%] w-[61%] rounded-[58%_42%_38%_62%/50%_65%_35%_50%] bg-[#bd826b]" />

      <svg
        viewBox="0 0 500 500"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <path
          d="M98 300C160 230 216 222 268 270C322 320 369 325 427 260"
          stroke="white"
          strokeWidth="2"
          opacity="0.75"
        />

        <path
          d="M118 353C180 303 221 299 267 332C309 362 360 365 409 330"
          stroke="#754636"
          strokeWidth="1.5"
          opacity="0.4"
        />

        <circle cx="248" cy="148" r="16" fill="#743d2d" />

        <circle
          cx="405"
          cy="112"
          r="32"
          stroke="white"
          strokeWidth="2"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}

function TraumaIllustration() {
  return (
    <div className="absolute inset-0 bg-[#e7e0d5]">
      <div className="absolute right-[13%] top-[18%] h-[68%] w-[50%] rounded-[53%_47%_43%_57%/42%_58%_42%_58%] bg-[#9c9277]" />

      <svg
        viewBox="0 0 500 500"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <path d="M99 136L151 118L164 173L125 204Z" fill="#9c9277" />
        <path d="M70 221L126 190L143 247L94 275Z" fill="#9c9277" />
        <path d="M88 309L139 273L158 326L109 351Z" fill="#9c9277" />
        <path d="M128 386L169 348L195 397L153 422Z" fill="#9c9277" />

        <path
          d="M286 118L264 205L300 247L275 320L306 392"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
        />

        <path
          d="M279 209L239 230"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <path
          d="M298 248L337 268"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <circle
          cx="410"
          cy="145"
          r="50"
          fill="#f7f3eb"
          opacity="0.75"
        />
      </svg>
    </div>
  );
}

function BurnoutIllustration() {
  const circles = [
    ["18%", "42%", "70px", "#5d7489"],
    ["27%", "24%", "58px", "#8295a5"],
    ["40%", "14%", "65px", "#9cabb8"],
    ["54%", "25%", "80px", "#73889c"],
    ["67%", "15%", "58px", "#8b9cab"],
    ["73%", "39%", "76px", "#607b92"],
    ["62%", "57%", "50px", "#93a3af"],
    ["42%", "65%", "48px", "#60788e"],
    ["25%", "62%", "62px", "#8294a3"],
    ["15%", "58%", "42px", "#46657e"],
  ];

  return (
    <div className="absolute inset-0 bg-[#dce5e6]">
      <div className="absolute left-[27%] top-[28%] h-[45%] w-[45%] rounded-full bg-[#425f79]" />

      {circles.map(([left, top, size, background], index) => (
        <span
          key={index}
          className="absolute rounded-full opacity-90"
          style={{
            left,
            top,
            width: size,
            height: size,
            background,
          }}
        />
      ))}

      <div className="absolute bottom-[18%] right-[10%] h-24 w-24 rounded-full border border-white/70" />

      <div className="absolute bottom-[23%] left-[10%] h-4 w-4 rounded-full bg-[#35566e]" />
    </div>
  );
}

function SelfEsteemIllustration() {
  return (
    <div className="absolute inset-0 bg-[#e8dfeb]">
      <div className="absolute left-[9%] top-[12%] h-[80%] w-[79%] rounded-[48%_52%_60%_40%/38%_62%_38%_62%] bg-[#d8c9db]" />

      <div className="absolute left-[18%] top-[23%] h-[62%] w-[64%] rounded-[47%_53%_55%_45%/42%_58%_42%_58%] bg-[#c9b4ce]" />

      <div className="absolute left-[28%] top-[34%] h-[45%] w-[47%] rounded-[54%_46%_49%_51%/48%_55%_45%_52%] bg-[#ad8eb2]" />

      <div className="absolute left-[40%] top-[47%] h-[25%] w-[25%] rounded-[55%_45%_58%_42%/45%_55%_45%_55%] bg-[#694a70]" />

      <svg
        viewBox="0 0 500 500"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <path
          d="M86 415C113 355 137 322 165 290"
          stroke="#87708c"
          strokeWidth="2"
        />

        <path d="M118 357L82 338" stroke="#87708c" strokeWidth="2" />
        <path d="M137 330L168 299" stroke="#87708c" strokeWidth="2" />
        <path d="M102 388L68 376" stroke="#87708c" strokeWidth="2" />

        <circle
          cx="390"
          cy="120"
          r="38"
          stroke="white"
          strokeWidth="2"
          opacity="0.75"
        />

        <circle cx="390" cy="120" r="15" fill="white" />
      </svg>
    </div>
  );
}

function OCDIllustration() {
  return (
    <div className="absolute inset-0 bg-[#d9e4e0]">
      <svg
        viewBox="0 0 500 500"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        {[60, 105, 150, 195].map((radius) => (
          <circle
            key={radius}
            cx="250"
            cy="265"
            r={radius}
            stroke="#4f8490"
            strokeWidth="2"
            opacity={radius === 195 ? 0.65 : 0.9}
          />
        ))}

        <circle
          cx="398"
          cy="106"
          r="45"
          stroke="#4f8490"
          strokeWidth="2"
          strokeDasharray="8 8"
        />

        <circle
          cx="412"
          cy="310"
          r="34"
          stroke="#4f8490"
          strokeWidth="2"
          strokeDasharray="8 8"
        />

        <circle cx="340" cy="265" r="27" fill="#337888" />

        <path
          d="M250 70V112"
          stroke="#d9e4e0"
          strokeWidth="8"
        />
      </svg>
    </div>
  );
}

function GriefIllustration() {
  return (
    <div className="absolute inset-0 bg-[#eee3d9]">
      <svg
        viewBox="0 0 500 500"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <path
          d="M84 369C54 267 97 134 213 91C332 47 448 140 447 270C446 380 358 456 252 449C174 444 114 419 84 369Z"
          fill="#c8bdae"
        />

        <ellipse cx="255" cy="268" rx="93" ry="118" fill="#eee3d9" />

        <path
          d="M363 448C352 374 368 298 405 223"
          stroke="#8d806d"
          strokeWidth="2"
        />

        <path d="M391 267L419 246" stroke="#8d806d" strokeWidth="2" />
        <path d="M382 294L353 274" stroke="#8d806d" strokeWidth="2" />
        <path d="M373 327L403 311" stroke="#8d806d" strokeWidth="2" />
        <path d="M368 354L340 337" stroke="#8d806d" strokeWidth="2" />

        <circle cx="414" cy="213" r="4" fill="#8d806d" />
      </svg>
    </div>
  );
}

function ParentingIllustration() {
  return (
    <div className="absolute inset-0 bg-[#e4e1d4]">
      <svg
        viewBox="0 0 500 500"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <ellipse
          cx="236"
          cy="279"
          rx="137"
          ry="169"
          transform="rotate(16 236 279)"
          fill="#c3ad82"
        />

        <ellipse
          cx="337"
          cy="345"
          rx="74"
          ry="103"
          transform="rotate(5 337 345)"
          fill="#d8b85c"
        />

        <circle cx="275" cy="125" r="69" fill="#c8b28a" />
        <circle cx="348" cy="274" r="42" fill="#d8b85c" />

        <path
          d="M137 322C174 390 259 420 341 386"
          stroke="#867855"
          strokeWidth="2"
          opacity="0.65"
        />

        <path
          d="M266 179C284 221 320 242 351 244"
          stroke="#867855"
          strokeWidth="2"
          opacity="0.55"
        />

        <circle cx="420" cy="112" r="30" fill="#eee6d3" />
      </svg>
    </div>
  );
}

function EatingIllustration() {
  return (
    <div className="absolute inset-0 bg-[#eadfdc]">
      <svg
        viewBox="0 0 500 500"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <ellipse
          cx="174"
          cy="286"
          rx="125"
          ry="93"
          transform="rotate(-16 174 286)"
          fill="#d8aaa1"
        />

        <ellipse
          cx="326"
          cy="286"
          rx="125"
          ry="93"
          transform="rotate(16 326 286)"
          fill="#cb948c"
        />

        <ellipse cx="250" cy="286" rx="42" ry="95" fill="#75485e" />

        <path
          d="M250 85V433"
          stroke="#75485e"
          strokeWidth="2"
        />

        <circle
          cx="250"
          cy="85"
          r="10"
          fill="#eadfdc"
          stroke="#75485e"
          strokeWidth="2"
        />

        <circle cx="250" cy="433" r="8" fill="#75485e" />

        <path
          d="M376 410C402 355 407 293 400 233"
          stroke="#70545f"
          strokeWidth="3"
        />

        <path d="M397 267L430 240" stroke="#70545f" strokeWidth="3" />
        <path d="M402 302L439 286" stroke="#70545f" strokeWidth="3" />
        <path d="M400 339L433 352" stroke="#70545f" strokeWidth="3" />
        <path d="M390 375L420 397" stroke="#70545f" strokeWidth="3" />
      </svg>
    </div>
  );
}