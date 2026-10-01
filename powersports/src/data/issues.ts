export type Severity = "minor" | "moderate" | "major";
export type IssueKind = "owner-reported" | "service-bulletin" | "recall";

export interface CommonIssue {
  id: string;
  modelSlug: string;
  title: string;
  severity: Severity;
  kind: IssueKind;
  years: string;
  symptoms: string;
  fix: string;
  estCost: string;
  /** Approximate count of owner threads/posts discussing it in the sources. */
  mentions: number;
  sources: string[];
}

type Raw = Omit<CommonIssue, "id">;

const RAW: Raw[] = [
  // Polaris Sportsman 570
  { modelSlug: "polaris-sportsman-570", title: "Belt slipping or smoking after water crossings", severity: "moderate", kind: "owner-reported", years: "All", symptoms: "Bogging, burning smell or squeal after riding through deep water.", fix: "Pull the CVT drain plug and dry the clutch housing in neutral at high idle; avoid deep water or add a snorkel kit.", estCost: "$0–$180 (belt)", mentions: 410, sources: ["r/ATV", "PolarisATVForums"] },
  { modelSlug: "polaris-sportsman-570", title: "AWD not engaging (hub coil / wiring)", severity: "moderate", kind: "owner-reported", years: "2014–2021", symptoms: "AWD light on but front wheels don't pull.", fix: "Check AWD connector and fuse first; replace the front hub coil if voltage is present.", estCost: "$40–$350", mentions: 260, sources: ["PolarisATVForums", "r/ATV"] },
  { modelSlug: "polaris-sportsman-570", title: "Electrical connector corrosion", severity: "minor", kind: "owner-reported", years: "All", symptoms: "Intermittent gauge, lights or starting issues after mud/wash.", fix: "Clean connectors and apply dielectric grease, especially under the front rack.", estCost: "$10", mentions: 180, sources: ["r/ATV"] },

  // Can-Am Outlander 700
  { modelSlug: "canam-outlander-700", title: "Water intrusion into CVT housing", severity: "moderate", kind: "owner-reported", years: "2022–2024", symptoms: "Belt slip and squeal after creek crossings.", fix: "Dry the CVT; some owners re-seal the cover and relocate the intake/outlet higher.", estCost: "$0–$250", mentions: 190, sources: ["r/canam", "CanAmOutlanderForum"] },
  { modelSlug: "canam-outlander-700", title: "Leg heat on long rides", severity: "minor", kind: "owner-reported", years: "2022–2026", symptoms: "Right leg gets hot near the exhaust/engine area.", fix: "Aftermarket heat shields/deflectors are a common fix.", estCost: "$60–$150", mentions: 140, sources: ["r/canam"] },

  // Honda Foreman
  { modelSlug: "honda-foreman-520", title: "Rough ride from solid rear axle", severity: "minor", kind: "owner-reported", years: "All", symptoms: "Choppy ride on rough trails compared to IRS rivals.", fix: "Lower tire pressure; upgraded rear shock helps.", estCost: "$0–$600", mentions: 120, sources: ["HondaATVForums", "r/ATV"] },
  { modelSlug: "honda-foreman-520", title: "ESP shift motor / angle sensor faults", severity: "moderate", kind: "owner-reported", years: "2020–2022", symptoms: "Blinking gear indicator, won't shift electrically.", fix: "Clean shift-motor brushes and connectors; replace the angle sensor if faulted.", estCost: "$50–$400", mentions: 95, sources: ["HondaATVForums"] },

  // Yamaha Grizzly
  { modelSlug: "yamaha-grizzly-eps", title: "Front CV boot tears", severity: "minor", kind: "owner-reported", years: "All", symptoms: "Grease slung on the inside of the wheel; clicking in turns if ignored.", fix: "Replace boot early before the joint is contaminated.", estCost: "$30–$200", mentions: 110, sources: ["YamahaGrizzly.net", "r/ATV"] },
  { modelSlug: "yamaha-grizzly-eps", title: "EPS fault light after deep water", severity: "minor", kind: "owner-reported", years: "2016–2020", symptoms: "Steering goes heavy with EPS warning.", fix: "Dry and clean the EPS connector; usually resolves.", estCost: "$0", mentions: 70, sources: ["YamahaGrizzly.net"] },

  // Kawasaki Brute Force
  { modelSlug: "kawasaki-brute-force-750", title: "Overheating in mud / clogged radiator", severity: "moderate", kind: "owner-reported", years: "All", symptoms: "Fan running constantly, temp light in slow mud riding.", fix: "Radiator relocation kit and regular cleaning.", estCost: "$150–$400", mentions: 380, sources: ["MudInMyBlood", "r/ATV"] },
  { modelSlug: "kawasaki-brute-force-750", title: "Stator / voltage regulator failure", severity: "moderate", kind: "owner-reported", years: "2012–2018", symptoms: "Battery not charging, dim lights, dying at idle.", fix: "Test charging output; replace stator or regulator as needed.", estCost: "$150–$450", mentions: 240, sources: ["KawieForums"] },
  { modelSlug: "kawasaki-brute-force-750", title: "Sealed rear brake gets water/mud", severity: "minor", kind: "owner-reported", years: "All", symptoms: "Weak or dragging rear brake.", fix: "Service the enclosed wet brake and replace seals.", estCost: "$80–$250", mentions: 130, sources: ["KawieForums"] },

  // CFMOTO CForce
  { modelSlug: "cfmoto-cforce-600", title: "Parts availability and dealer wait times", severity: "moderate", kind: "owner-reported", years: "2019–2023", symptoms: "Weeks-long waits for warranty parts.", fix: "Check dealer parts stock before buying; online OEM sellers help.", estCost: "n/a", mentions: 220, sources: ["r/CFMOTO", "CFMotoForums"] },
  { modelSlug: "cfmoto-cforce-600", title: "Intermittent electrical gremlins", severity: "minor", kind: "owner-reported", years: "2019–2022", symptoms: "Gauge resets, odd warning lights.", fix: "Inspect ground straps and main harness connectors.", estCost: "$0–$100", mentions: 150, sources: ["r/CFMOTO"] },

  // RZR XP 1000
  { modelSlug: "polaris-rzr-xp-1000", title: "Drive belt wear / failure", severity: "moderate", kind: "owner-reported", years: "All", symptoms: "Belt shreds on climbs, in low-speed high-load riding, or with bigger tires.", fix: "Use low range below ~15 mph, break in new belts, recalibrate clutching for larger tires; carry a spare.", estCost: "$150–$250 per belt", mentions: 920, sources: ["r/RZR", "RZRForums"] },
  { modelSlug: "polaris-rzr-xp-1000", title: "Fire-risk recalls on some model years", severity: "major", kind: "recall", years: "Some 2014–2016", symptoms: "Recalls addressed heat/fire risks on certain units.", fix: "Run the VIN through the manufacturer recall lookup and confirm all work is completed.", estCost: "Free (recall)", mentions: 300, sources: ["NHTSA / CPSC recall notices", "r/RZR"] },
  { modelSlug: "polaris-rzr-xp-1000", title: "Cab heat on the driver's side", severity: "minor", kind: "owner-reported", years: "2014–2023", symptoms: "Hot air through the floor and console.", fix: "Heat shielding and console vent kits.", estCost: "$50–$200", mentions: 340, sources: ["RZRForums"] },

  // RZR Pro R
  { modelSlug: "polaris-rzr-pro-r", title: "Width limits trail access", severity: "minor", kind: "owner-reported", years: "All", symptoms: "74\"+ width won't fit 50\"/64\" trails in many areas.", fix: "Know your local trail width limits before buying.", estCost: "n/a", mentions: 150, sources: ["r/RZR"] },
  { modelSlug: "polaris-rzr-pro-r", title: "Early-build belt & clutch tuning", severity: "moderate", kind: "service-bulletin", years: "2022–2023", symptoms: "Belt temps and wear higher than expected in sand.", fix: "Ask the dealer about updated clutch components/software.", estCost: "Often warranty", mentions: 120, sources: ["RZRForums", "r/RZR"] },

  // Ranger XP 1000
  { modelSlug: "polaris-ranger-xp-1000", title: "Belt wear under heavy towing", severity: "moderate", kind: "owner-reported", years: "All", symptoms: "Belt glazing/slipping when pulling loads in high range.", fix: "Use low range for towing and heavy loads.", estCost: "$150–$220", mentions: 280, sources: ["PolarisRangerClub", "r/SXSCommunity"] },
  { modelSlug: "polaris-ranger-xp-1000", title: "Rattles and panel fit", severity: "minor", kind: "owner-reported", years: "2018–2021", symptoms: "Dash and door rattles, cab panel squeaks.", fix: "Foam tape and re-torque panel fasteners.", estCost: "$20", mentions: 160, sources: ["PolarisRangerClub"] },

  // Maverick X3
  { modelSlug: "canam-maverick-x3", title: "Belt life on tuned / big-tire cars", severity: "moderate", kind: "owner-reported", years: "All", symptoms: "Belts glaze or blow quickly after power upgrades or 32\"+ tires.", fix: "Clutch kit matched to the tune and tire size, proper belt break-in.", estCost: "$200–$900", mentions: 760, sources: ["r/canam", "CanAmX3Forum"] },
  { modelSlug: "canam-maverick-x3", title: "Rear trailing arm / hardware wear", severity: "moderate", kind: "owner-reported", years: "2017–2020", symptoms: "Clunks from the rear; loose hardware after hard desert use.", fix: "Inspect and re-torque; upgraded arms for heavy desert use.", estCost: "$0–$2,000", mentions: 210, sources: ["CanAmX3Forum"] },
  { modelSlug: "canam-maverick-x3", title: "Cab heat and dust", severity: "minor", kind: "owner-reported", years: "All", symptoms: "Warm cab and dust intrusion.", fix: "Heat shielding and sealed doors/rear window.", estCost: "$100–$600", mentions: 190, sources: ["r/canam"] },

  // Defender HD10
  { modelSlug: "canam-defender-hd10", title: "Front diff / Visco-Lok service", severity: "moderate", kind: "owner-reported", years: "2016–2019", symptoms: "Clunking or 4WD engagement problems.", fix: "Fluid service and inspection; some owners needed diff rebuilds.", estCost: "$80–$1,200", mentions: 120, sources: ["DefenderForum"] },
  { modelSlug: "canam-defender-hd10", title: "Electrical accessory overload", severity: "minor", kind: "owner-reported", years: "All", symptoms: "Blown fuses after adding lights, plow and heater.", fix: "Run a separate fused power block for accessories.", estCost: "$40–$150", mentions: 85, sources: ["DefenderForum", "r/canam"] },

  // Pioneer 1000
  { modelSlug: "honda-pioneer-1000", title: "Jerky low-speed DCT engagement", severity: "minor", kind: "owner-reported", years: "2016–2018", symptoms: "Lurching at walking pace, clunky low-speed shifts.", fix: "Clutch-learning reset at the dealer; ECU updates on later years.", estCost: "$0–$150", mentions: 230, sources: ["PioneerForums", "r/SXSCommunity"] },
  { modelSlug: "honda-pioneer-1000", title: "Seat comfort on long days", severity: "minor", kind: "owner-reported", years: "All", symptoms: "Firm bench seat.", fix: "Aftermarket seat covers/cushions.", estCost: "$100–$300", mentions: 90, sources: ["PioneerForums"] },

  // Talon
  { modelSlug: "honda-talon-1000r", title: "Limited factory accessories", severity: "minor", kind: "owner-reported", years: "2019–2021", symptoms: "Fewer bolt-on doors/roofs/stereos compared to Polaris/Can-Am.", fix: "Aftermarket has caught up; check fitment by year.", estCost: "n/a", mentions: 80, sources: ["TalonForums"] },
  { modelSlug: "honda-talon-1000r", title: "Steering rack / tie rod wear", severity: "moderate", kind: "owner-reported", years: "2019–2021", symptoms: "Play in steering after hard use.", fix: "Upgraded tie rods; inspect the rack.", estCost: "$200–$700", mentions: 110, sources: ["TalonForums", "r/SXSCommunity"] },

  // YXZ
  { modelSlug: "yamaha-yxz1000r", title: "Clutch wear from launches/abuse", severity: "moderate", kind: "owner-reported", years: "All", symptoms: "Slipping or grabby clutch.", fix: "Heavy-duty clutch kit; avoid repeated full-throttle launches.", estCost: "$300–$700", mentions: 170, sources: ["YXZForum", "r/YXZ"] },
  { modelSlug: "yamaha-yxz1000r", title: "Stiff stock ride", severity: "minor", kind: "owner-reported", years: "2016–2018", symptoms: "Harsh in chatter and whoops.", fix: "Re-valve shocks or use the SE/XT-R trims.", estCost: "$600–$2,000", mentions: 120, sources: ["YXZForum"] },

  // KRX
  { modelSlug: "kawasaki-krx-1000", title: "Belt wear when crawling in high range", severity: "moderate", kind: "owner-reported", years: "2020–2022", symptoms: "Belt glazing on slow technical climbs.", fix: "Use low range; check CVT intake for debris.", estCost: "$150–$250", mentions: 210, sources: ["KRXForums", "r/SXSCommunity"] },
  { modelSlug: "kawasaki-krx-1000", title: "Heavy curb weight", severity: "minor", kind: "owner-reported", years: "All", symptoms: "Feels sluggish vs sport rivals.", fix: "Expected trade-off for heavy-duty components.", estCost: "n/a", mentions: 90, sources: ["KRXForums"] },

  // ZForce
  { modelSlug: "cfmoto-zforce-950", title: "Parts backorders", severity: "moderate", kind: "owner-reported", years: "2021–2023", symptoms: "Long waits for body panels and suspension parts.", fix: "Confirm local dealer support; stock common wear parts.", estCost: "n/a", mentions: 160, sources: ["r/CFMOTO"] },
  { modelSlug: "cfmoto-zforce-950", title: "Faster depreciation", severity: "minor", kind: "owner-reported", years: "All", symptoms: "Trade-in values below Japanese/US brands.", fix: "Buy used for best value; expect lower resale.", estCost: "n/a", mentions: 120, sources: ["r/SXSCommunity"] },

  // Summit X
  { modelSlug: "skidoo-summit-x", title: "Heat exchanger icing / snow packing", severity: "minor", kind: "owner-reported", years: "2017–2020", symptoms: "Snow builds in tunnel and running boards in deep powder.", fix: "Aftermarket running boards and regular clearing.", estCost: "$0–$400", mentions: 140, sources: ["SnowestForum", "r/sledding"] },
  { modelSlug: "skidoo-summit-x", title: "E-TEC injector / sensor faults", severity: "moderate", kind: "owner-reported", years: "2017–2019", symptoms: "Limp mode, rough running at altitude.", fix: "Dealer diagnosis (BUDS); updated software and injectors.", estCost: "$0–$900", mentions: 170, sources: ["SnowestForum"] },

  // Renegade
  { modelSlug: "skidoo-renegade", title: "Carbide and hyfax wear on low-snow trails", severity: "minor", kind: "owner-reported", years: "All", symptoms: "Fast slide wear, darting steering.", fix: "Ice scratchers and checking hyfax often.", estCost: "$100–$250", mentions: 130, sources: ["DooTalk", "r/sledding"] },
  { modelSlug: "skidoo-renegade", title: "Rear suspension bushings", severity: "minor", kind: "owner-reported", years: "2017–2020", symptoms: "Clunks and slop in the rear skid.", fix: "Grease regularly; replace bushings.", estCost: "$60–$200", mentions: 80, sources: ["DooTalk"] },

  // RMK Khaos
  { modelSlug: "polaris-rmk-khaos", title: "Early Matryx recalls / updates", severity: "major", kind: "recall", years: "Some 2021–2022", symptoms: "Recalls and service updates on certain early units.", fix: "Check the VIN with a Polaris dealer for open recalls.", estCost: "Free (recall)", mentions: 210, sources: ["SnowestForum", "r/sledding"] },
  { modelSlug: "polaris-rmk-khaos", title: "Clutch tuning at elevation", severity: "minor", kind: "owner-reported", years: "All", symptoms: "Lost top-end or belt slip at high altitude.", fix: "Altitude-specific clutch weights/springs.", estCost: "$150–$400", mentions: 120, sources: ["SnowestForum"] },

  // Indy VR1
  { modelSlug: "polaris-indy-vr1", title: "Harsh for casual riders", severity: "minor", kind: "owner-reported", years: "All", symptoms: "Stiff setup beats up non-aggressive riders.", fix: "Soften clickers; the XC trim is a better fit for many.", estCost: "$0", mentions: 70, sources: ["HCS Forums", "r/sledding"] },

  // Catalyst
  { modelSlug: "arcticcat-catalyst", title: "New-platform teething issues", severity: "moderate", kind: "service-bulletin", years: "2024", symptoms: "Early software/hardware updates on first-year units.", fix: "Confirm all bulletins are applied before buying used.", estCost: "Often warranty", mentions: 130, sources: ["ArcticChat", "r/sledding"] },

  // Sidewinder
  { modelSlug: "yamaha-sidewinder", title: "Weight in deep snow", severity: "minor", kind: "owner-reported", years: "All", symptoms: "Heavy and harder to dig out than 2-strokes.", fix: "Best for trails/lakes; know its purpose.", estCost: "n/a", mentions: 90, sources: ["HCS Forums"] },
  { modelSlug: "yamaha-sidewinder", title: "Turbo heat & oil service", severity: "minor", kind: "owner-reported", years: "2017–2020", symptoms: "Cooling and oil service sensitivity in low-snow conditions.", fix: "Ice scratchers, follow oil service intervals.", estCost: "$50–$150", mentions: 70, sources: ["HCS Forums"] },

  // Africa Twin
  { modelSlug: "honda-africa-twin", title: "DCT low-speed feel off-road", severity: "minor", kind: "owner-reported", years: "2016–2019", symptoms: "Abrupt engagement in tight, slow terrain.", fix: "Use G-switch mode; later software improved it.", estCost: "$0", mentions: 150, sources: ["ADVrider", "r/AfricaTwin"] },
  { modelSlug: "honda-africa-twin", title: "Tall seat height", severity: "minor", kind: "owner-reported", years: "All", symptoms: "Hard to flat-foot for shorter riders.", fix: "Low seat or lowering link (or Adventure Sports low trim).", estCost: "$150–$400", mentions: 110, sources: ["ADVrider"] },

  // T7
  { modelSlug: "yamaha-tenere-700", title: "Fuel pump issues on some early bikes", severity: "moderate", kind: "service-bulletin", years: "2021–2022", symptoms: "Stalling, fuel starvation at low fuel levels.", fix: "Check with a dealer that the updated pump/bulletin was applied.", estCost: "Often warranty", mentions: 260, sources: ["ADVrider", "r/Tenere700"] },
  { modelSlug: "yamaha-tenere-700", title: "Wind buffeting", severity: "minor", kind: "owner-reported", years: "All", symptoms: "Helmet buffeting at highway speed.", fix: "Aftermarket windscreen or deflector.", estCost: "$80–$200", mentions: 200, sources: ["r/Tenere700"] },
  { modelSlug: "yamaha-tenere-700", title: "Soft stock suspension for heavier riders", severity: "minor", kind: "owner-reported", years: "2021–2024", symptoms: "Bottoming when loaded or on hard hits.", fix: "Springs for rider weight or a re-valve.", estCost: "$300–$1,500", mentions: 180, sources: ["ADVrider"] },

  // 890
  { modelSlug: "ktm-890-adventure", title: "Exposed low-slung tanks", severity: "minor", kind: "owner-reported", years: "All", symptoms: "Tank damage in tip-overs.", fix: "Tank guards/crash bars.", estCost: "$300–$600", mentions: 120, sources: ["ADVrider", "r/KTM"] },
  { modelSlug: "ktm-890-adventure", title: "Valve service cost", severity: "minor", kind: "owner-reported", years: "All", symptoms: "Expensive major services.", fix: "Budget for scheduled service; find an independent KTM tech.", estCost: "$600–$1,000", mentions: 90, sources: ["ADVrider"] },

  // 300 XC-W
  { modelSlug: "ktm-300-xcw", title: "Early TPI cold-start / oil pump issues", severity: "moderate", kind: "owner-reported", years: "2018–2019", symptoms: "Hard cold starts, oil pump concerns.", fix: "Updated software/components; many owners pre-mix as backup.", estCost: "$0–$300", mentions: 300, sources: ["ThumperTalk", "r/Dirtbikes"] },
  { modelSlug: "ktm-300-xcw", title: "Top-end maintenance interval", severity: "minor", kind: "owner-reported", years: "All", symptoms: "Piston wear with hard use.", fix: "Track hours; rebuild per interval.", estCost: "$300–$600", mentions: 140, sources: ["ThumperTalk"] },

  // CRF450R
  { modelSlug: "honda-crf450r", title: "Valve clearance tightening", severity: "moderate", kind: "owner-reported", years: "2017–2020", symptoms: "Hard starting when hot.", fix: "Check valves on schedule; replace valves/seats if receding.", estCost: "$100–$800", mentions: 220, sources: ["ThumperTalk", "r/Dirtbikes"] },

  // MT-07
  { modelSlug: "yamaha-mt-07", title: "Budget suspension", severity: "minor", kind: "owner-reported", years: "2015–2020", symptoms: "Bouncy rear and soft fork when pushed.", fix: "Rear shock upgrade, fork springs/cartridges.", estCost: "$400–$1,200", mentions: 260, sources: ["r/MT07", "r/motorcycles"] },
  { modelSlug: "yamaha-mt-07", title: "Abrupt throttle on early models", severity: "minor", kind: "owner-reported", years: "2015–2017", symptoms: "Snatchy on/off throttle.", fix: "Later ECU mapping improved; smoother riding technique helps.", estCost: "$0", mentions: 120, sources: ["r/MT07"] },

  // Rebel
  { modelSlug: "honda-rebel-500", title: "Small fuel tank range", severity: "minor", kind: "owner-reported", years: "All", symptoms: "Limited range on long rides.", fix: "Plan fuel stops.", estCost: "n/a", mentions: 90, sources: ["r/HondaRebel"] },

  // Ninja 650
  { modelSlug: "kawasaki-ninja-650", title: "Soft brakes and basic suspension", severity: "minor", kind: "owner-reported", years: "2017–2023", symptoms: "Vague brake feel and soft fork under hard braking.", fix: "Upgraded pads/lines and fork springs.", estCost: "$150–$600", mentions: 110, sources: ["r/Ninja650", "r/motorcycles"] },
];

export const ISSUES: CommonIssue[] = RAW.map((r, i) => ({ ...r, id: `${r.modelSlug}-${i}` }));

export function issuesFor(slug: string) {
  const sevOrder: Record<Severity, number> = { major: 0, moderate: 1, minor: 2 };
  return ISSUES.filter((i) => i.modelSlug === slug).sort(
    (a, b) => sevOrder[a.severity] - sevOrder[b.severity] || b.mentions - a.mentions,
  );
}
