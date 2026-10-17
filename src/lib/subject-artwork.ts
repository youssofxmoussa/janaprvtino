import cytologie from "@/assets/subjects/generated/cytologie.webp";
import animal from "@/assets/subjects/generated/histologie-animale.webp";
import vegetal from "@/assets/subjects/generated/histologie-vegetale.webp";
import botany from "@/assets/subjects/generated/botany.webp";
import flower from "@/assets/subjects/generated/reproduction-vegetale.webp";
import genetics from "@/assets/subjects/generated/genetics.webp";
import anatomy from "@/assets/subjects/generated/anatomie.webp";
import chemistry from "@/assets/subjects/generated/chemistry_gen.webp";
import fluids from "@/assets/subjects/generated/physics_fluids.webp";
import analysis from "@/assets/subjects/generated/analysis.webp";
import optics from "@/assets/subjects/generated/physics_optics.webp";
import organic from "@/assets/subjects/generated/chemistry_org.webp";
import solution from "@/assets/subjects/generated/chemistry_sol.webp";
import statistics from "@/assets/subjects/generated/statistics.webp";
import ecology from "@/assets/subjects/generated/ecology.webp";
import embryo from "@/assets/subjects/generated/embryology.webp";

export const subjectArtwork: Record<string, string> = {
  histology: cytologie, botany, genetics, chemistry_gen: chemistry,
  physics_fluids: fluids, analysis, physics_optics: optics,
  chemistry_org: organic, chemistry_sol: solution, statistics,
  ecology, embryology: embryo,
};

export const partArtwork: Record<string, string> = {
  cytologie, "histologie-animale": animal, "histologie-vegetale": vegetal,
  botanique: botany, "reproduction-vegetale": flower, genetique: genetics,
  anatomie: anatomy, ecologie: ecology, geologie: ecology,
  "reproduction-animale": embryo, embryologie: embryo,
};