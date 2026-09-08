import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, HallTicketResponse } from '../../types';
import { Ticket, Printer, ShieldCheck, AlertCircle, Calendar } from 'lucide-react';

export const StudentHallTicket: React.FC = () => {
  const { user } = useAuth();
  const student = user as StudentUser;

  const [data, setData] = useState<HallTicketResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student?.uid) return;
    const fetchHallTicket = async () => {
      try {
        const res = await fetch(`/api/examinations/hall-ticket/${student.uid}`);
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const ticketData = await res.json();
            setData(ticketData);
          }
        }
      } catch (err) {
        console.error('Error fetching hall ticket:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHallTicket();
  }, [student?.uid]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Action Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Official Examination Hall Ticket</h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Autonomous examination authorization pass certified by the Controller of Examinations.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-950 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-900 transition-colors cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          <span>Print Hall Ticket</span>
        </button>
      </div>

      {/* Hall Ticket Document Container */}
      <div className="overflow-hidden rounded-2xl border-2 border-slate-400 bg-white p-6 shadow-md sm:p-8 print:border-none print:p-0 print:shadow-none">
        {/* Institutional Letterhead */}
        <div className="border-b-2 border-slate-900 pb-5 text-center">
          <div className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
            Affiliated to APJ Abdul Kalam Technological University | Autonomous
          </div>
          <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            RAJAGIRI SCHOOL OF ENGINEERING & TECHNOLOGY
          </h2>
          <p className="text-xs text-slate-600">
            Rajagiri Valley, Kakkanad, Kochi, Kerala - 682039
          </p>
          <div className="mt-2 inline-block rounded bg-indigo-950 px-4 py-1 text-xs font-bold text-white uppercase tracking-wider">
            {data?.exam_title || 'B.Tech Degree Examination 2026 - Hall Ticket'}
          </div>
        </div>

        {/* Candidate Details & Photo */}
        <div className="mt-6 flex flex-col-reverse justify-between gap-6 sm:flex-row sm:items-start border-b border-slate-200 pb-6">
          <div className="grid flex-1 grid-cols-2 gap-y-3 text-xs">
            <div>
              <span className="text-[11px] font-semibold text-slate-500">Student Name:</span>
              <div className="text-sm font-bold text-slate-900">{student?.name}</div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500">Register Number (UID):</span>
              <div className="font-mono text-sm font-bold text-indigo-950">{student?.uid}</div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500">Program / Branch:</span>
              <div className="font-medium text-slate-900">{student?.department}</div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500">Class / Semester:</span>
              <div className="font-medium text-slate-900">{student?.class} (Semester {student?.semester})</div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500">Official Exam Centre:</span>
              <div className="font-medium text-slate-900">RSET Main Academic Complex</div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500">Date of Issue:</span>
              <div className="font-mono text-slate-700">{data?.generated_at}</div>
            </div>
          </div>

          {/* Photo & Signature */}
          <div className="flex flex-col items-center gap-2 self-center sm:self-start">
            <img
              src={student?.photo || '/assets/default_student_avatar.svg'}
              alt={student?.name}
              className="h-28 w-24 rounded border border-slate-400 object-cover p-0.5"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/default_student_avatar.svg';
              }}
            />
            <div className="w-24 text-center border-t border-dashed border-slate-400 pt-1 text-[10px] font-mono text-slate-600 truncate">
              {student?.signature || student?.name}
            </div>
          </div>
        </div>

        {/* Timetable / Hall Allocations Table */}
        <div className="mt-6">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            Course Examination Timetable & Seating Allocation
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b-2 border-slate-300 bg-slate-100 text-[11px] font-bold text-slate-800">
                <tr>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Session Time</th>
                  <th className="px-4 py-2.5">Course / Subject</th>
                  <th className="px-3 py-2.5 text-center">Hall No</th>
                  <th className="px-3 py-2.5 text-center">Seat No</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {data?.exams.map((ex, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2.5 font-mono font-bold text-slate-900">{ex.exam_date}</td>
                    <td className="px-3 py-2.5 text-slate-600">{ex.exam_time}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{ex.subject}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-indigo-950">{ex.room}</td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-900">{ex.seat_no}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-[11px] text-slate-600">
          <div className="font-bold text-slate-900 uppercase">Important Candidate Instructions:</div>
          <ol className="mt-1.5 list-decimal space-y-1 pl-4">
            {data?.instructions.map((inst, idx) => (
              <li key={idx}>{inst}</li>
            ))}
          </ol>
        </div>

        {/* Signatures */}
        <div className="mt-8 flex justify-between pt-6 text-center text-xs font-semibold text-slate-700">
          <div>
            <div className="h-8"></div>
            <div className="border-t border-slate-400 pt-1">Candidate&apos;s Signature</div>
          </div>
          <div>
            <div className="h-8"></div>
            <div className="border-t border-slate-400 pt-1">Chief Superintendent</div>
          </div>
          <div>
            <div className="h-8 font-mono text-indigo-950 font-bold">RSET COE SEAL</div>
            <div className="border-t border-slate-400 pt-1">Controller of Examinations</div>
          </div>
        </div>
      </div>
    </div>
  );
};
