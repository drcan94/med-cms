import type { VisitSheetEntry } from "@/lib/visit-sheet"

type PrintableVisitSheetProps = {
  patients: VisitSheetEntry[]
}

export function PrintableVisitSheet({
  patients,
}: Readonly<PrintableVisitSheetProps>) {
  return (
    <>
      <div className="hidden items-end justify-between pb-4 text-black print:flex">
        <div>
          <h1 className="text-xl font-semibold">Visit Sheet</h1>
          <p className="text-sm">Dense A4 rounding list for bedside review.</p>
        </div>
        <p className="text-sm">Patients: {patients.length}</p>
      </div>

      <table className="hidden w-full border-collapse text-[11px] leading-4 text-black print:table">
        <thead>
          <tr>
            <th className="w-[13%] border border-black px-2 py-2 text-left font-semibold uppercase">
              Bed
            </th>
            <th className="w-[24%] border border-black px-2 py-2 text-left font-semibold uppercase">
              Full Name
            </th>
            <th className="w-[12%] border border-black px-2 py-2 text-left font-semibold uppercase">
              Days
            </th>
            <th className="w-[23%] border border-black px-2 py-2 text-left font-semibold uppercase">
              Diagnosis
            </th>
            <th className="w-[14%] border border-black px-2 py-2 text-left font-semibold uppercase">
              Drains/Fluids
            </th>
            <th className="w-[14%] border border-black px-2 py-2 text-left font-semibold uppercase">
              Notes
            </th>
          </tr>
        </thead>

        <tbody>
          {patients.length > 0 ? (
            patients.map((patient) => (
              <tr key={patient.id} className="align-top [page-break-inside:avoid]">
                <td className="border border-black px-2 py-2 font-semibold">
                  {patient.bedDisplay}
                </td>
                <td className="border border-black px-2 py-2">{patient.fullName}</td>
                <td className="border border-black px-2 py-2">{patient.daySummary}</td>
                <td className="border border-black px-2 py-2">{patient.diagnosis}</td>
                <td className="h-14 border border-black px-2 py-2" />
                <td className="h-14 border border-black px-2 py-2" />
              </tr>
            ))
          ) : (
            <tr>
              <td className="border border-black px-2 py-6 text-center" colSpan={6}>
                No patients available for the active organization.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  )
}
