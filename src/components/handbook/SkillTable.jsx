// Generic ranked skill table for the handbook.
// Columns and data are passed in so this component works for any skill type.

const COLUMNS = [
  { key: 'prereq',             label: <>Prereq</>,              },
  { key: 'name',               label: <>Skill</>,               },
  { key: 'description',        label: <>Description</>,         },
  { key: 'costPerRank',        label: <>Cost/<wbr/>Rank</>,     },
  { key: 'maxRank',            label: <>Max</>,                  },
  { key: 'mcl',                label: <>MCL</>,                  },
  { key: 'maintenancePerRank', label: <>Maint/<wbr/>Rank</>,    },
]

export default function SkillTable({ skills }) {
  if (!skills?.length) return null

  return (
    <div className="skill-table-wrap">
      <table className="skill-table">
        <thead>
          <tr>
            {COLUMNS.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {skills.map((skill, i) => (
            <tr key={skill.name} className={i % 2 === 0 ? 'row-even' : 'row-odd'}>
              {COLUMNS.map(col => (
                <td key={col.key} className={`col-${col.key}`}>
                  {skill[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
