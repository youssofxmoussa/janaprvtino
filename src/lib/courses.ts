import { partArtwork, subjectArtwork } from "./subject-artwork";

export type CoursePart = { id: string; title: string; subtitle: string; image: string };

export type Course = {
  id: string;
  title: string;
  credits: number;
  progress: number;
  image?: string;
  iconName?: string;
  tint: string;
  semester: number;
  parts: CoursePart[];
};

const cours = (image: string, title = "Cours"): CoursePart => ({ id: "cours", title, subtitle: "Lectures", image });
const td = (image: string, title = "TD"): CoursePart => ({ id: "td", title, subtitle: "Travaux dirigés", image });

export const courses: Course[] = [
  // Semester 1
  {
    id: "b1100", title: "B1100 (Cytologie + Histologie)", credits: 6, progress: 0, tint: "bg-blue-500/10", semester: 1, image: "/imgs/histology.webp",
    parts: [
      { id: "cytologie", title: "Cytologie", subtitle: "Cell biology", image: "/imgs/histology.webp" },
      { id: "histologie-animale", title: "Histologie animale", subtitle: "Animal tissues", image: "/imgs/embryology.webp" },
      { id: "histologie-vegetale", title: "Histologie végétale", subtitle: "Plant tissues", image: "/imgs/botany.webp" },
    ],
  },
  {
    id: "b1101", title: "B1101 (Botanique + Reproduction végétale)", credits: 3, progress: 0, tint: "bg-green-500/10", semester: 1, image: "/imgs/botany.webp",
    parts: [
      { id: "botanique", title: "Botanique", subtitle: "Plant biology", image: "/imgs/botany.webp" },
      { id: "reproduction-vegetale", title: "Reproduction végétale", subtitle: "Plant reproduction", image: "/imgs/ecology.webp" },
    ],
  },
  {
    id: "b1102", title: "B1102 (Génétique + Anatomie)", credits: 3, progress: 0, tint: "bg-red-500/10", semester: 1, image: "/imgs/genetics.webp",
    parts: [
      { id: "genetique", title: "Génétique", subtitle: "Heredity & DNA", image: "/imgs/genetics.webp" },
      { id: "anatomie", title: "Anatomie", subtitle: "Body structure", image: "/imgs/embryology.webp" },
    ],
  },
  { id: "c1100", title: "C1100 (Chimie générale)", credits: 6, progress: 0, tint: "bg-purple-500/10", semester: 1, image: "/imgs/chemistry_gen.webp", parts: [cours("/imgs/chemistry_gen.webp"), td("/imgs/chemistry_gen.webp")] },
  { id: "p1104", title: "P1104 (Fluides + Mécanique & Thermo)", credits: 6, progress: 0, tint: "bg-orange-500/10", semester: 1, image: "/imgs/physics_fluids.webp", parts: [cours("/imgs/physics_fluids.webp"), td("/imgs/physics_fluids.webp", "Supplémentaires / TD")] },
  { id: "m1109", title: "M1109 (Analyse)", credits: 6, progress: 0, tint: "bg-indigo-500/10", semester: 1, image: "/imgs/analysis.webp", parts: [cours("/imgs/analysis.webp"), td("/imgs/analysis.webp")] },

  // Semester 2
  { id: "p1105", title: "P1105 (Physique)", credits: 6, progress: 0, tint: "bg-violet-500/10", semester: 2, image: "/imgs/physics_optics.webp", parts: [cours("/imgs/physics_optics.webp", "Physique"), td("/imgs/physics_optics.webp")] },
  { id: "c1102", title: "C1102 (Chimie organique)", credits: 6, progress: 0, tint: "bg-rose-500/10", semester: 2, image: "/imgs/chemistry_org.webp", parts: [cours("/imgs/chemistry_org.webp", "Chimie organique"), td("/imgs/chemistry_org.webp")] },
  { id: "c1103", title: "C1103 (Chimie de solution)", credits: 6, progress: 0, tint: "bg-cyan-500/10", semester: 2, image: "/imgs/chemistry_sol.webp", parts: [cours("/imgs/chemistry_sol.webp", "Chimie de solution"), td("/imgs/chemistry_sol.webp")] },
  { id: "s1100", title: "S1100 (Statistique)", credits: 3, progress: 0, tint: "bg-slate-500/10", semester: 2, image: "/imgs/statistics.webp", parts: [cours("/imgs/statistics.webp", "Statistique"), td("/imgs/statistics.webp")] },
  {
    id: "b1103", title: "B1103 (Écologie + Géologie)", credits: 3, progress: 0, tint: "bg-emerald-500/10", semester: 2, image: "/imgs/ecology.webp",
    parts: [
      { id: "ecologie", title: "Écologie", subtitle: "Ecosystems", image: "/imgs/ecology.webp" },
      { id: "geologie", title: "Géologie", subtitle: "Earth science", image: "/imgs/physics_fluids.webp" },
    ],
  },
  {
    id: "b1105", title: "B1105 (Reproduction animale + Embryologie)", credits: 3, progress: 0, tint: "bg-yellow-500/10", semester: 2, image: "/imgs/embryology.webp",
    parts: [
      { id: "reproduction-animale", title: "Reproduction animale", subtitle: "Animal reproduction", image: "/imgs/genetics.webp" },
      { id: "embryologie", title: "Embryologie", subtitle: "Development", image: "/imgs/embryology.webp" },
    ],
  },
];

// Reuse the same illustrated family for course cards and their sections.
for (const course of courses) {
  const imageKey = course.image?.split("/").pop()?.replace(".webp", "");
  if (imageKey && subjectArtwork[imageKey]) course.image = subjectArtwork[imageKey];
  for (const part of course.parts) {
    const key = part.image.split("/").pop()?.replace(".webp", "");
    part.image = partArtwork[part.id] ?? (key ? subjectArtwork[key] : undefined) ?? part.image;
  }
}

export const findCourse = (id: string) => courses.find((c) => c.id === id.toLowerCase());
export const findPart = (courseId: string, partId: string) => findCourse(courseId)?.parts.find((p) => p.id === partId);
