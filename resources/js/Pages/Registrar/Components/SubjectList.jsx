import SubjectCard from './SubjectCard'

export default function SubjectList({ subjects = [], onEdit, onDelete }) {
  if (subjects.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No subjects found matching your search criteria.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {subjects.map((subject) => (
        <SubjectCard
          key={subject.Id}
          subject={subject}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
