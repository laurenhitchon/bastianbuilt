import type { ProjectMediaItem } from './media'

export interface Project {
  slug: string
  title: string
  description: string
  image: string | ProjectMediaItem
  tags: string[]
  overview: string
  features: string[]
  specs: {
    label: string
    value: string
  }[]
  process: string[]
  gallery: Array<string | ProjectMediaItem>
}

export const projects: Project[] = [
  {
    slug: 'yzf-r7-pod-filter-airbox',
    title: 'YZF-R7 Pod Filter Airbox',
    description:
      'Custom 3D printed pod filter airbox for the Yamaha YZF-R7, designed from full 3D scan data for precise fitment and clean integration.',
    image: '/yzf-r7-pod-filter-airbox/DUuIP8kkjld_1.jpg',
    tags: ['Yamaha', 'YZF-R7', 'Airbox'],
    overview:
      'This custom YZF-R7 pod filter airbox began with a full 3D scan of the intake area to capture every mounting point, contour, and clearance. A replica model of the DNA pod filter was created to ensure perfect alignment from the outset. Designed entirely in Fusion 360 around real-world scan data, the airbox delivers precise fitment, structural integrity, and a clean OEM-plus look once installed. Printed in multiple materials to balance strength, heat resistance, and flexibility, it features brass inserts, a serviceable lid, and a hex rear vent for controlled airflow. Clean on the bike. Functional by design.',
    features: [
      'Full 3D scan-based design for exact fitment and clearance control',
      'Replica-modeled DNA pod filter for precision integration',
      'Multi-material construction for strength and flexibility',
      'Serviceable lid with brass threaded inserts',
      'Hex-pattern rear vent for controlled airflow and visual detail',
    ],
    specs: [
      { label: 'Material', value: 'ASA-CF (shell), TPU (flexible joiners), Brass inserts' },
      { label: 'Print Method', value: 'FDM 3D Printing (Multi-material)' },
      { label: 'Weight', value: 'Custom application – lightweight performance-focused design' },
      { label: 'Dimensions', value: 'Designed specifically for Yamaha YZF-R7 intake area' },
      {
        label: 'Post-Processing',
        value: 'Heat-set brass inserts, assembly hardware installation, final fitment testing',
      },
    ],
    process: [
      'Full 3D scan of the YZF-R7 intake and surrounding frame area',
      'Digital cleanup and preparation of scan data',
      'Creation of a replica DNA pod filter model for accurate fit',
      'Airbox design in Fusion 360 around real-world geometry',
      'Multi-material print preparation and prototyping',
      'Final printing, hardware installation, and on-bike fitment validation',
    ],
    gallery: [
      '/yzf-r7-pod-filter-airbox/DUuIP8kkjld_1.jpg',
      '/yzf-r7-pod-filter-airbox/DUuIP8kkjld_2.jpg',
      '/yzf-r7-pod-filter-airbox/DUuIP8kkjld_3.jpg',
      '/yzf-r7-pod-filter-airbox/DUuIP8kkjld_4.jpg',
      '/yzf-r7-pod-filter-airbox/DUuIP8kkjld_5.jpg',
      '/yzf-r7-pod-filter-airbox/DUuIP8kkjld_6.jpg',
    ],
  },
  {
    slug: 'ute-tray-accessory-design-kt-kustoms',
    title: 'Ute Tray & Accessory Design – KT Kustoms',
    description:
      'Custom ute tray design work for KT Kustoms featuring honeycomb headboard infills with integrated logos, precision tail light cutouts, and machine-ready fabrication plans.',
    image: '/ute-tray-and-accessory-design/DUxqybukrQz_1.jpg',
    tags: ['Ute Tray', 'Fabrication Design', 'KT Kustoms'],
    overview:
      'Recent ute tray and accessory design work completed for KT Kustoms, focused on precision-cut components and custom branding integration. The project included honeycomb headboard infills with integrated business logos, purpose-designed tail light cutouts to suit HiMod4x4 Drakon / Jimny lights and Stedi flush mount lights, and custom rear sections with truck-style lighting and twin exhaust ports. Each component was digitally designed for high accuracy, reduced fabrication time, and optimal material usage. The result is a clean, professional tray that stands out both on site and on the road.',
    features: [
      'Custom honeycomb headboard infills with integrated business logos',
      'Precision cutouts for HiMod4x4 Drakon / Jimny tail lights',
      'Stedi flush mount light compatibility',
      'Retrofit honeycomb infill options for existing headboards',
      'Custom rear section with truck-style tail light cutouts and twin exhaust ports',
    ],
    specs: [
      {
        label: 'Material',
        value: 'Designed for steel or aluminium tray fabrication (as specified by builder)',
      },
      { label: 'Print Method', value: 'CAD design with CNC / laser-cut ready files' },
      { label: 'Weight', value: 'Varies depending on tray configuration and material selection' },
      {
        label: 'Dimensions',
        value: 'Custom designed to suit specific ute tray and headboard setups',
      },
      {
        label: 'Post-Processing',
        value: 'Welding, finishing, and coating completed by fabricator (KT Kustoms)',
      },
    ],
    process: [
      'Concept development in collaboration with KT Kustoms',
      'Digital design of honeycomb infill panels with integrated branding',
      'Precision modeling of tail light and accessory cutouts',
      'Preparation of machine-ready cutting files',
      'Material optimisation for reduced waste and faster fabrication',
      'Final fabrication, welding, and fitment by KT Kustoms',
    ],
    gallery: [
      '/ute-tray-and-accessory-design/DUxqybukrQz_1.jpg',
      '/ute-tray-and-accessory-design/DUxqybukrQz_2.jpg',
      '/ute-tray-and-accessory-design/DUxqybukrQz_3.jpg',
      '/ute-tray-and-accessory-design/DUxqybukrQz_4.jpg',
      '/ute-tray-and-accessory-design/DUxqybukrQz_5.jpg',
    ],
  },
  {
    slug: 'cbr600rr-engine-case-cover',
    title: 'CBR600RR Engine Case Cover',
    description:
      'Engine case covers designed from a 3D scan of the OEM case to lock in clearances and fitment. Modelled using surface techniques to speed up complex geometry creation, then printed as a solid, sacrificial protection part for high-impact areas.',
    image: '/cbr600rr-engine-case-cover/engine-case-cover-design-1.png',
    tags: ['Fusion 360', 'Surface Modelling', 'PA-CF (CF Nylon)'],
    overview:
      'Designed directly over a 3D scan of the OEM engine case, these covers were built to achieve reliable clearances and a true “bolt-on” fit before fabrication. Surface modelling was used instead of traditional solid modelling to form the complex curvature quickly, cutting modelling time significantly. The final covers are printed with a thick 4mm wall and solid infill in carbon fibre–reinforced nylon for heat resistance, low friction sliding, and abrasion resistance in impact zones.',
    features: [
      '3D scan–referenced geometry for accurate clearances and fitment',
      'Surface-modelled form for fast creation of complex curves',
      '4mm wall thickness for robust sacrificial protection',
      'Solid infill construction for maximum impact durability',
      'CF-reinforced nylon for heat resistance, low friction, and abrasion performance',
    ],
    specs: [
      { label: 'Material', value: 'Carbon Fibre–reinforced Nylon (PA-CF)' },
      { label: 'Print Method', value: 'FDM (solid infill, 4mm wall)' },
      { label: 'Weight', value: '' },
      { label: 'Dimensions', value: '' },
      { label: 'Post-Processing', value: '' },
    ],
    process: [
      '3D scan OEM engine case as dimensional reference',
      'Import scan into Fusion 360 and establish fitment clearances',
      'Surface modelling to generate complex cover geometry efficiently',
      'Iterate model and validate clearances',
      'Print in PA-CF with thick wall and solid infill',
      'Final fitment check and refinement as needed',
    ],
    gallery: [
      '/cbr600rr-engine-case-cover/engine-case-cover-design.jpg',
      '/cbr600rr-engine-case-cover/motorcycle-engine-case-cover-1.jpg',
      '/cbr600rr-engine-case-cover/motorcycle-engine-case-cover-2.jpg',
      '/cbr600rr-engine-case-cover/cbr600rr-engine-case-cover-design.mp4',
      '/cbr600rr-engine-case-cover/cbr600rr-engine-case-cover-3d-printing.mp4',
    ],
  },
  {
    slug: 'cbr600rr-gp-style-front-fender-prototype',
    title: 'CBR600RR GP Style Front Fender Prototype',
    description:
      'A Moto2-inspired GP-style front fender prototype, designed to reduce frontal drag and better shield fork tubes versus the OEM hugger. Built as a surface-modelling learning project in Fusion 360.',
    image: '/cbr600rr-gp-style-front-fender-prototype/motorcycle-front-fender-prototype.jpg',
    tags: ['Fusion 360', 'Surface Modelling', 'Moto2 Aero'],
    overview:
      'This prototype draws from Moto2 aero—especially the Kalex front fender profile—to create a slimmer, more purposeful shape than the OEM hugger. The intent is reduced frontal drag and improved fork-tube shielding, while pushing surface modelling skills in Fusion 360 where complex curvature is best handled. The design is prepared for physical prototyping via 3D printing.',
    features: [
      'Moto2/Kalex-inspired aero profile',
      'Reduced frontal area compared to OEM hugger style',
      'Improved fork-tube shielding and spray control',
      'Complex surface-driven curvature for smooth airflow',
      'Prototype-ready CAD prepared for 3D printed test fitting',
    ],
    specs: [
      { label: 'Material', value: '' },
      { label: 'Print Method', value: '' },
      { label: 'Weight', value: '' },
      { label: 'Dimensions', value: '' },
      { label: 'Post-Processing', value: '' },
    ],
    process: [
      'Study Moto2 front fender profiles and OEM reference geometry',
      'Block out fender proportions and mounting constraints',
      'Build primary surfaces and guide curves in Fusion 360',
      'Refine transitions, curvature continuity, and edge definition',
      'Prepare prototype for 3D printing and test fit',
      'Iterate based on fitment and visual/aero intent',
    ],
    gallery: [
      '/cbr600rr-gp-style-front-fender-prototype/cbr600rr-gp-style-front-fender-prototype-1.jpg',
      '/cbr600rr-gp-style-front-fender-prototype/cbr600rr-gp-style-front-fender-prototype-2.jpg',
      '/cbr600rr-gp-style-front-fender-prototype/red-motorcycle-front-fender-prototype-1.jpg',
      '/cbr600rr-gp-style-front-fender-prototype/red-motorcycle-front-fender-prototype-2.jpg',
    ],
  },
  {
    slug: '1780-x-2000-mm-tray-ln106-single-cab-beta-design',
    title: '1780 × 2000 mm Tray — LN106 Single Cab (Beta Design)',
    description:
      'Early-stage CAD tray concept for a single-cab LN106, designed around APB canopy and under-tray boxes with integrated lighting mounts and animated components for motion testing.',
    image: '/1780-×-2000-mm-tray-ln106-single-cab-beta-design/utility-tray-design-single-cab.jpg',
    tags: ['Fusion 360', 'Vehicle CAD', 'Design for Fabrication'],
    overview:
      'A beta-stage custom tray design sized at 1780 × 2000mm for a single-cab LN106. The layout accommodates an APB canopy and under-tray storage, with clean integrated mounts for JB74 tail lights and recessed Stedi C4 reverse/flood lights. The CAD includes animated components (like opening doors) and modular mounting points to validate motion, clearances, and accessory placement. Future refinement is planned, including 3D scanning the rear cab and chassis to digitally capture mounting points and confirm fitment in a full vehicle assembly.',
    features: [
      '1780 × 2000mm footprint tailored to LN106 single cab',
      'Designed to suit APB canopy and under-tray boxes',
      'Integrated mounts for JB74 tail lights',
      'Recessed rear Stedi C4 reverse/flood light integration',
      'Animated CAD components for motion/clearance validation',
    ],
    specs: [
      { label: 'Material', value: '' },
      { label: 'Print Method', value: 'N/A (CAD for fabrication)' },
      { label: 'Weight', value: '' },
      { label: 'Dimensions', value: '1780 × 2000mm' },
      { label: 'Post-Processing', value: '' },
    ],
    process: [
      'Define tray requirements (canopy, boxes, lighting, mounts)',
      'Build primary tray geometry and packaging in CAD',
      'Integrate lighting mounts and recessed housings',
      'Add modular accessory mounting interfaces',
      'Animate key components for motion and clearance checks',
      'Plan next phase: 3D scan cab/chassis for exact mounting integration',
    ],
    gallery: [
      '/1780-×-2000-mm-tray-ln106-single-cab-beta-design/utility-tray-design-single-cab.jpg',
      '/1780-×-2000-mm-tray-ln106-single-cab-beta-design/utility-tray-design-single-cab.mp4',
    ],
  },
  {
    slug: 'engine-covers-cbr600-f2-f3',
    title: 'Engine Covers — CBR600 F2/F3',
    description:
      'Custom engine covers designed and produced for pre-modern racing where OEM replacements are hard to source. Built from 3D scans, iterated through test prints, then produced in PA-CF for heat and abrasion resistance.',
    image: '/engine-covers-cbr600-f2f3/engine-cover-design.jpg',
    tags: ['Fusion 360', '3D Scanning', 'PA-CF (CF Nylon)'],
    overview:
      'Replacement covers for older bikes like the CBR600 F2/F3 are difficult to find, so these were created as a functional alternative for a rider competing in pre-modern racing. Original engine cases were scanned to capture geometry accurately, then imported into Fusion 360 for modelling and refinement. Multiple fitment iterations and test prints were used to reach the final design. The finished parts are printed in carbon fibre–infused nylon (PA-CF) for strength, heat resistance, and low-friction abrasion performance near the engine.',
    features: [
      '3D scan–based modelling for accurate geometry capture',
      'Iterative fitment process with test prints',
      'Functional replacement solution for hard-to-source OEM parts',
      'PA-CF chosen for heat resistance and durability',
      'Low-friction, abrasion-resistant surface behaviour for racing use',
    ],
    specs: [
      { label: 'Material', value: 'Carbon Fibre–infused Nylon (PA-CF)' },
      { label: 'Print Method', value: 'FDM' },
      { label: 'Weight', value: '' },
      { label: 'Dimensions', value: '' },
      { label: 'Post-Processing', value: '' },
    ],
    process: [
      '3D scan original engine cases for reference geometry',
      'Import scan data into Fusion 360',
      'Model cover geometry and mounting interfaces',
      'Run fitment test prints and iterate for clearance',
      'Finalize design for strength and abrasion behaviour',
      'Print final parts in PA-CF and validate fit',
    ],
    gallery: [
      '/engine-covers-cbr600-f2f3/engine-cover-design.jpg',
      '/engine-covers-cbr600-f2f3/engine-cover-design.png',
      '/engine-covers-cbr600-f2f3/engine-cover-design-and-prototypes.jpg',
      '/engine-covers-cbr600-f2f3/honda-cbr600-engine-covers-design.mp4',
      '/engine-covers-cbr600-f2f3/honda-engine-cover-motorcycle.jpg',
      '/engine-covers-cbr600-f2f3/motorcycle-engine-cover-design.jpg',
    ],
  },
  {
    slug: 'want-the-coolest-bin-on-the-block',
    title: 'BINRIMS — Wheelie Bin Rims',
    description:
      'Multi-piece, 3D printed rim kit for a standard wheelie bin—styled after popular car wheel designs. Modular assembly mirrors real automotive wheels for realistic proportions and detailing.',
    image: '/binrims/stylish-bin-wheel.jpg',
    tags: ['Fusion 360', 'Product Design', 'Multi-piece Assembly'],
    overview:
      'BINRIMS is a playful product concept: multi-piece 3D printed rims for a standard wheelie bin, inspired by real car wheel designs so the bin can match the build. The rims are designed as an assembly like actual wheels, enabling accurate proportions, realistic detailing, and flexible styling/colour variants. The multipart approach also makes printing and finishing easier than a single monolithic part.',
    features: [
      'Multi-piece rim assembly inspired by real automotive wheels',
      'Designed for realistic proportions and detailing',
      'Modular components allow style and colour variations',
      '3D print–friendly segmentation for easier production',
      'Designed to suit standard wheelie bin wheels',
    ],
    specs: [
      { label: 'Material', value: '' },
      { label: 'Print Method', value: 'FDM' },
      { label: 'Weight', value: '' },
      { label: 'Dimensions', value: '' },
      { label: 'Post-Processing', value: '' },
    ],
    process: [
      'Reference automotive wheel designs and define rim styling',
      'Model multipart rim components for assembly',
      'Tune proportions and detailing for realism',
      'Design for printability (splits, alignments, fastening)',
      'Prototype print and check fit on bin wheel',
      'Refine design for repeatable production and variants',
    ],
    gallery: [
      '/binrims/stylish-bin-wheel.jpg',
      '/binrims/stylish-bin-wheels.jpg',
      '/binrims/stylish-green-bin-with-yellow-lid.jpg',
      '/binrims/stylish-green-bin-design.jpg',
    ],
  },
  {
    slug: 'subwoofer-box-fg-falcon-ute',
    title: 'Subwoofer Box — FG Falcon Ute',
    description:
      'Custom subwoofer enclosure designed from a full-width 3D scan of the rear cabin to fit the tight space behind the seats. Two variants were developed to suit dual 10” and dual 8” setups.',
    image: '/subwoofer-box-fg-falcon-ute/subwoofer-box-design-1.jpg',
    tags: ['3D Scanning', 'Fusion 360', 'Acoustic Packaging'],
    overview:
      'Off-the-shelf sub boxes rarely fit properly behind FG ute seats due to the tight packaging. This project used a 3D scan of the full rear cabin width to model the space accurately, then developed enclosures around volume and spacing requirements for sub performance. Two designs were created—dual 10” and dual 8”—as a practical exercise in scan-to-CAD workflow and constraint-driven packaging.',
    features: [
      'Full-width cabin scan used to capture exact mounting volume',
      'Purpose-built to fit behind seats where space is limited',
      'Two enclosure variants: dual 10” and dual 8”',
      'Designed around sub volume/spacing requirements',
      'Scan-to-CAD workflow for complex interior geometry',
    ],
    specs: [
      { label: 'Material', value: '' },
      { label: 'Print Method', value: '' },
      { label: 'Weight', value: '' },
      { label: 'Dimensions', value: '' },
      { label: 'Post-Processing', value: '' },
    ],
    process: [
      '3D scan rear cabin to capture complex geometry',
      'Clean and reference scan data for packaging',
      'Research enclosure volume and driver spacing requirements',
      'Model dual 10” enclosure concept and fit to scan',
      'Model dual 8” enclosure concept and fit to scan',
      'Review fitment and refine for practical installation',
    ],
    gallery: [
      '/subwoofer-box-fg-falcon-ute/subwoofer-box-design-1.jpg',
      '/subwoofer-box-fg-falcon-ute/subwoofer-box-design-2.jpg',
    ],
  },
  {
    slug: 'wheelchair-footrest-replacement',
    title: 'Wheelchair Footrest Replacement',
    description:
      '1:1 replacement footrest modelled from the intact opposite-side part using precise hand measurements. Reinforced redesign printed in ASA-CF for strength and UV durability in a load-bearing application.',
    image: '/wheelchair-footrest-replacement/wheelchair-footrest-replacement-1.jpg',
    tags: ['Reverse Engineering', 'ASA-CF', 'Functional Print'],
    overview:
      'A broken wheelchair footrest was recreated as a true 1:1 replacement by using the intact opposite-side footrest as the reference. Critical dimensions were captured with rulers and vernier calipers, then the part was remodelled and strengthened beyond the original design. The final part was printed in ASA-CF—carbon fibre–infused, UV-resistant engineering plastic—chosen for toughness and durability in a load-bearing, real-world use case.',
    features: [
      'Reverse-engineered from the intact opposite-side footrest',
      'Measured with calipers for accurate replication',
      'Redesigned with added strength over OEM geometry',
      'ASA-CF selected for durability and UV resistance',
      'Optimised for load-bearing functional use',
    ],
    specs: [
      { label: 'Material', value: 'ASA-CF (carbon fibre–infused ASA)' },
      { label: 'Print Method', value: 'FDM' },
      { label: 'Weight', value: '' },
      { label: 'Dimensions', value: '' },
      { label: 'Post-Processing', value: '' },
    ],
    process: [
      'Use intact footrest as dimensional reference',
      'Measure critical features with calipers and rulers',
      'Model replacement geometry and mounting interfaces',
      'Add reinforcement/strength features in weak areas',
      'Print in ASA-CF with functional orientation',
      'Test fit and validate under load',
    ],
    gallery: [
      '/wheelchair-footrest-replacement/wheelchair-footrest-replacement-1.jpg',
      '/wheelchair-footrest-replacement/wheelchair-footrest-design.jpg',
      '/wheelchair-footrest-replacement/wheelchair-footrest-replacement-2.jpg',
      '/wheelchair-footrest-replacement/wheelchair-footrest-replacement-3.jpg',
    ],
  },
  {
    slug: 'mid-century-home-1-64-scale-model',
    title: 'Mid-Century Home — 1:64 Scale Model',
    description:
      'A decorative 1:64 scale model recreated from original architectural plans plus reference photos of post-build modifications. Designed in Fusion 360 and printed in six PLA pieces.',
    image: '/architectural-model/architectural-model-modern-house.jpg',
    tags: ['Fusion 360', 'Scale Model', 'PLA Printing'],
    overview:
      'Using original architectural plans and reference photos of later modifications, this mid-century home was recreated as a 1:64 scale display model designed to work as a decorative centrepiece. The model was built in Fusion 360 and segmented into six printable parts for clean production and assembly. PLA was selected for its ease of printing and clean surface finish, keeping the build accessible and tidy while preserving the home’s architectural character.',
    features: [
      'Recreated from original plans plus reference photos',
      'Scaled accurately to 1:64 for display',
      'Segmented into six parts for printability and clean assembly',
      'Fusion 360 workflow for precise architectural detailing',
      'PLA chosen for clean finish and accessible fabrication',
    ],
    specs: [
      { label: 'Material', value: 'PLA' },
      { label: 'Print Method', value: 'FDM (multi-part print)' },
      { label: 'Weight', value: '' },
      { label: 'Dimensions', value: '1:64 scale' },
      { label: 'Post-Processing', value: '' },
    ],
    process: [
      'Review architectural plans and identify key features',
      'Cross-check modifications using reference photos',
      'Model the structure in Fusion 360 at 1:64 scale',
      'Split model into six printable components',
      'Print components and dry-fit for alignment',
      'Assemble into final decorative display model',
    ],
    gallery: [
      '/architectural-model/architectural-model-modern-house.jpg',
      '/architectural-model/architectural-model-on-wooden-table-1.jpg',
      '/architectural-model/architectural-model-on-wooden-table-2.jpg',
    ],
  },
  {
    slug: 'axle-sliders',
    title: 'Axle Sliders + Quad Lock Handlebar Mount',
    description:
      'CF-nylon axle sliders designed to slide (not grab) on impact thanks to low friction and high melting point. Includes a two-piece Quad Lock charger mount concept with notes for future improvements (TPU grip layer, nutserts).',
    image: '/axle-sliders/motorcycle-axle-slider-close-up.jpg',
    tags: ['PA-CF (CF Nylon)', 'Functional Parts', 'Motorcycle Protection'],
    overview:
      'These axle sliders are printed in carbon fibre–infused nylon to prioritise sliding behaviour on impact: nylon’s low friction and high melting point helps prevent catching during a slide, while slight flexibility absorbs shock. Carbon fibre reinforcement adds stiffness and improves layer bonding to resist splitting under stress. The post also includes a handlebar Quad Lock charger mount: a two-piece sliding clamp tightened with a bolt and nyloc nut. The design has proven durable over long-term use, with future improvements identified (TPU grip layer and nutserts).',
    features: [
      'Low-friction nylon base material to encourage sliding on impact',
      'High melting point improves survivability during prolonged contact',
      'CF reinforcement increases stiffness and reduces layer splitting',
      'Designed for impact-prone protection points (axle area)',
      'Two-piece handlebar clamp concept for reliable accessory mounting',
    ],
    specs: [
      { label: 'Material', value: 'Carbon Fibre–infused Nylon (PA-CF)' },
      { label: 'Print Method', value: 'FDM' },
      { label: 'Weight', value: '' },
      { label: 'Dimensions', value: '' },
      { label: 'Post-Processing', value: '' },
    ],
    process: [
      'Define impact/sliding requirements for slider behaviour',
      'Select PA-CF for low friction, heat tolerance, and stiffness',
      'Model slider geometry for strength and replaceability',
      'Tune print orientation/settings to maximise layer bonding',
      'Prototype print and assess real-world handling/fitment',
      'Iterate based on wear, fit, and future improvements (TPU, nutserts)',
    ],
    gallery: [
      '/axle-sliders/motorcycle-axle-slider-close-up.jpg',
      '/axle-sliders/motorcycle-handlebar-mount.jpg',
      '/axle-sliders/motorcycle-rear-wheel-and-exhaust.jpg',
    ],
  },
  {
    slug: '97-hilux-extra-cab-rn110r-tray-build',
    title: '’97 Hilux Extra Cab (RN110R) — Tray Build',
    description:
      'First tray design-and-build project (completed Nov 2023), developed from measurements and reference photos and fabricated via hands-on welding and manual cutting. Includes learnings and what would change today: 3D scanning + CNC-cut parts for accuracy and repeatability.',
    image: '/97-hilux-extra-cab-rn110r-tray-build/custom-offroad-truck-bed.png',
    tags: ['Fabrication', 'Welding', 'Design Iteration'],
    overview:
      'This was the first full tray I designed and built, finished in November 2023. It was created from hand measurements and reference photos to get proportions and fitment right, and it became a deep learning project in welding, material choice, and structural rigidity. Looking back, the biggest improvements would be eliminating guesswork through 3D scanning during design, and using CNC-cut parts to speed fabrication while improving accuracy and repeatability compared with manual cutting and shaping.',
    features: [
      'Designed from measurements and reference photos for fitment',
      'Hands-on fabrication project with welding and assembly',
      'Focused on structural rigidity and functional layout',
      'Clear learnings captured for future iteration',
      'Planned improvements: 3D scanning + CNC-cut components',
    ],
    specs: [
      { label: 'Material', value: '' },
      { label: 'Print Method', value: 'N/A (fabricated)' },
      { label: 'Weight', value: '' },
      { label: 'Dimensions', value: '' },
      { label: 'Post-Processing', value: '' },
    ],
    process: [
      'Measure vehicle and establish tray constraints',
      'Draft proportions and layout using reference photos',
      'Select materials and plan structure for rigidity',
      'Cut and shape components manually',
      'Weld and assemble tray structure',
      'Review outcomes and document improvements for next build (scan + CNC)',
    ],
    gallery: [
      '/97-hilux-extra-cab-rn110r-tray-build/custom-offroad-truck-bed.jpg',
      '/97-hilux-extra-cab-rn110r-tray-build/custom-offroad-truck-bed.mp4',
      '/97-hilux-extra-cab-rn110r-tray-build/custom-truck-bed-with-spare-tire.jpg',
      '/97-hilux-extra-cab-rn110r-tray-build/modern-white-structure-in-workshop.jpg',
      '/97-hilux-extra-cab-rn110r-tray-build/off-road-vehicle-frame.jpg',
    ],
  },
  {
    slug: 'n50-hilux-toyota-grill-badge',
    title: 'N50 Hilux TOYOTA Grill Badge',
    description:
      'A first-ever custom car-part print revisited and redesigned in mid-2025 into a cleaner three-piece badge (adapter, base, lettering) assembled with nutserts, screws, and glue—removing the need for supports and improving durability.',
    image: '/n50-hilux-toyota-grill-badge/toyota-hilux-front-grill.png',
    tags: ['Fusion 360', '3D Printing', 'Multi-piece Assembly'],
    overview:
      'This badge started as an early custom car-part experiment and was later redesigned from scratch into a more production-friendly three-piece system: adapter, base, and lettering. The revised design uses nutserts, screws, and glue for assembly, reducing print supports and cutting production time. Swapping hand-painted lettering for solid white plastic improved long-term durability by eliminating fading and scratch-prone paint.',
    features: [
      'Redesigned into a three-piece system (adapter, base, lettering)',
      'Assembled with nutserts, screws, and glue for a clean build',
      'Support-free printing approach reduces post work and time',
      'Durable solid-colour lettering replaces hand-painted finish',
      'Improved serviceability and repeatability vs original version',
    ],
    specs: [
      { label: 'Material', value: '' },
      { label: 'Print Method', value: 'FDM (multi-piece, support-minimised)' },
      { label: 'Weight', value: '' },
      { label: 'Dimensions', value: '' },
      { label: 'Post-Processing', value: '' },
    ],
    process: [
      'Review original badge design and identify weak points',
      'Redesign geometry from scratch for cleaner form and function',
      'Split into three parts for printing and assembly',
      'Design fastening strategy using nutserts and screws',
      'Prototype print to verify fit and assembly sequence',
      'Finalize with solid-colour lettering and durable assembly method',
    ],
    gallery: [
      '/n50-hilux-toyota-grill-badge/toyota-hilux-front-grill.png',
      '/n50-hilux-toyota-grill-badge/toyota-hilux-front-grill.jpg',
      '/n50-hilux-toyota-grill-badge/toyota-hilux-front-grill.mp4',
      '/n50-hilux-toyota-grill-badge/toyota-hilux-front-view.jpg',
    ],
  },
  /* {
    slug: '',
    title: '',
    description:
      '',
    image: '/',
    tags: ['', '', ''],
    overview:
      '',
    features: [
      '',
      '',
      '',
      '',
      '',
    ],
    specs: [
      { label: 'Material', value: '' },
      { label: 'Print Method', value: '' },
      { label: 'Weight', value: '' },
      { label: 'Dimensions', value: '' },
      { label: 'Post-Processing', value: '' },
    ],
    process: [
      '',
      '',
      '',
      '',
      '',
      '',
    ],
    gallery: [
      '/',
      '/',
      '/',
      '/',
    ],
  }, */
]

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug)
}
