import SectionCard from './SectionCard'

export default function SectionList({ sections = [], onEdit, onToggle }) {
  if (sections.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No sections found matching your search.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          onEdit={onEdit}
          onToggle={onToggle}
        />
      ))}
    </div>
  )
}
