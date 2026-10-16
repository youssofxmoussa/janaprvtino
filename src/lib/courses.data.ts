import { Course } from "./courses";
import histology from "@/assets/subjects/histology.png";
import botany from "@/assets/subjects/botany.png";
import genetics from "@/assets/subjects/genetics.png";
import chemistry_gen from "@/assets/subjects/chemistry_gen.png";
import physics_fluids from "@/assets/subjects/physics_fluids.png";
import analysis from "@/assets/subjects/analysis.png";
import ecology from "@/assets/subjects/ecology.png";
import embryology from "@/assets/subjects/embryology.png";
import chemistry_org from "@/assets/subjects/chemistry_org.png";
import chemistry_sol from "@/assets/subjects/chemistry_sol.png";
import physics_optics from "@/assets/subjects/physics_optics.png";
import algebra from "@/assets/subjects/algebra.png";
import statistics from "@/assets/subjects/statistics.png";

export const coursesWithImages: Course[] = [
  // Semester 1
  { id: "b1100", title: "B1100(Cyto+Animal & Plant Histology)", credits: 6, progress: 0, tint: "bg-blue-500/10", semester: 1, image: histology },
  { id: "b1101", title: "B1101(Botany+Plant Reproduction)", credits: 3, progress: 0, tint: "bg-green-500/10", semester: 1, image: botany },
  { id: "b1102", title: "B1102(Genetics+Anatomy)", credits: 3, progress: 0, tint: "bg-red-500/10", semester: 1, image: genetics },
  { id: "c1100", title: "C1100(General Chemistry)", credits: 6, progress: 0, tint: "bg-purple-500/10", semester: 1, image: chemistry_gen },
  { id: "p1104", title: "P1104(Fluids+Mechanics & Thermo)", credits: 6, progress: 0, tint: "bg-orange-500/10", semester: 1, image: physics_fluids },
  { id: "m1109", title: "M1109(Analysis)", credits: 6, progress: 0, tint: "bg-indigo-500/10", semester: 1, image: analysis },
  
  // Semester 2
  { id: "b1103", title: "B1103(Ecology+Geology)", credits: 3, progress: 0, tint: "bg-emerald-500/10", semester: 2, image: ecology },
  { id: "b1105", title: "B1105(Embryo+Animal Reproduction)", credits: 3, progress: 0, tint: "bg-yellow-500/10", semester: 2, image: embryology },
  { id: "c1102", title: "C1102(Organic Chemistry)", credits: 6, progress: 0, tint: "bg-rose-500/10", semester: 2, image: chemistry_org },
  { id: "c1103", title: "C1103(Chemistry of Solution)", credits: 6, progress: 0, tint: "bg-cyan-500/10", semester: 2, image: chemistry_sol },
  { id: "p1105", title: "P1105(Optics+Electricity & Magnetism)", credits: 6, progress: 0, tint: "bg-violet-500/10", semester: 2, image: physics_optics },
  { id: "m1111", title: "M1111(Algebra)", credits: 3, progress: 0, tint: "bg-amber-500/10", semester: 2, image: algebra },
  { id: "s1100", title: "S1100(Statistics)", credits: 3, progress: 0, tint: "bg-slate-500/10", semester: 2, image: statistics },
];
