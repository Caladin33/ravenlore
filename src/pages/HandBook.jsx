import skills from "../data/arcaneSkills.json";
import SkillTable from "../components/SkillTable";

export default function Handbook() {
  return (
    <div className="handbook">

      <h1>RavenLore Player's Handbook</h1>

      <h2>Melee Skills</h2>

      <SkillTable
        skills={skills.filter(s => s.category === "Melee")}
      />

    </div>
  );
}