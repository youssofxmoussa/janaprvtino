export type Course = {
  id: string;
  title: string;
  credits: number;
  progress: number;
  image?: string;
  iconName?: string;
  tint: string;
  semester: number;
};

export const courses: Course[] = [
  // Semester 1
  { id: "b1100", title: "B1100 (Cyto+Animal & Plant Histology)", credits: 6, progress: 0, tint: "bg-blue-500/10", semester: 1, image: "/imgs/histology.webp" },
  { id: "b1101", title: "B1101 (Botany+Plant Reproduction)", credits: 3, progress: 0, tint: "bg-green-500/10", semester: 1, image: "/imgs/botany.webp" },
  { id: "b1102", title: "B1102 (Genetics+Anatomy)", credits: 3, progress: 0, tint: "bg-red-500/10", semester: 1, image: "/imgs/genetics.webp" },
  { id: "c1100", title: "C1100 (General Chemistry)", credits: 6, progress: 0, tint: "bg-purple-500/10", semester: 1, image: "/imgs/chemistry_gen.webp" },
  { id: "p1104", title: "P1104 (Fluids+Mechanics & Thermo)", credits: 6, progress: 0, tint: "bg-orange-500/10", semester: 1, image: "/imgs/physics_fluids.webp" },
  { id: "m1109", title: "M1109 (Analysis)", credits: 6, progress: 0, tint: "bg-indigo-500/10", semester: 1, image: "/imgs/analysis.webp" },
  
  // Semester 2
  { id: "b1103", title: "B1103 (Ecology+Geology)", credits: 3, progress: 0, tint: "bg-emerald-500/10", semester: 2, image: "/imgs/ecology.webp" },
  { id: "b1105", title: "B1105 (Embryo+Animal Reproduction)", credits: 3, progress: 0, tint: "bg-yellow-500/10", semester: 2, image: "/imgs/embryology.webp" },
  { id: "c1102", title: "C1102 (Organic Chemistry)", credits: 6, progress: 0, tint: "bg-rose-500/10", semester: 2, image: "/imgs/chemistry_org.webp" },
  { id: "c1103", title: "C1103 (Chemistry of Solution)", credits: 6, progress: 0, tint: "bg-cyan-500/10", semester: 2, image: "/imgs/chemistry_sol.webp" },
  { id: "p1105", title: "P1105 (Optics+Electricity & Magnetism)", credits: 6, progress: 0, tint: "bg-violet-500/10", semester: 2, image: "/imgs/physics_optics.webp" },
  { id: "m1111", title: "M1111 (Algebra)", credits: 3, progress: 0, tint: "bg-amber-500/10", semester: 2, image: "/imgs/algebra.webp" },
  { id: "s1100", title: "S1100 (Statistics)", credits: 3, progress: 0, tint: "bg-slate-500/10", semester: 2, image: "/imgs/statistics.webp" },
];
