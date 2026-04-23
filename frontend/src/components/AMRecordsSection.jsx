// // const AMS = ["Shalini","Shubha","Shataveeresh","Sathvik","Sweatha","Subhashini","Jaibheema","xxx","yyy","zzz"];

// function AMRecordsSection({ entries }) {
//   const [selectedAM, setSelectedAM] = useState(AMS[0]);
//   const amEntries = entries.filter(r => r.am === selectedAM);

//   return (
//     <>
//       <div className="filter-bar">
//         <div className="filter-group">
//           <label>Account Manager</label>
//           <select value={selectedAM} onChange={e => setSelectedAM(e.target.value)}>
//             {AMS.map(am => <option key={am}>{am}</option>)}
//           </select>
//         </div>
//       </div>

//       <div className="metric-grid">
//         <MetricCard label="Total selections"   value={amEntries.filter(r=>r.type==="selection").length}  color="blue" />
//         <MetricCard label="Total onboardings"  value={amEntries.filter(r=>r.type==="onboarding").length} color="green" />
//         <MetricCard label="Bench selections"   value={amEntries.filter(r=>r.type==="selection"&&r.source==="Bench").length} color="neutral" />
//         <MetricCard label="Partner selections" value={amEntries.filter(r=>r.type==="selection"&&r.source==="Partner").length} color="amber" />
//       </div>

//       {["selection","onboarding","offboarding"].map(type => (
//         <div key={type}>
//           <p className="section-title" style={{marginTop:14}}>
//             {type.charAt(0).toUpperCase()+type.slice(1)}s
//           </p>
//           <div className="table-wrap">
//             <table>
//               <thead>
//                 <tr><th>Date</th><th>Client</th><th>Vertical</th><th>Source</th><th>Type</th><th>Remarks</th></tr>
//               </thead>
//               <tbody>
//                 {amEntries.filter(r=>r.type===type).length === 0
//                   ? <tr><td colSpan="6" className="empty-cell">No entries</td></tr>
//                   : amEntries.filter(r=>r.type===type).map(r => (
//                     <tr key={r.id}>
//                       <td>{fmt(r.date)}</td>
//                       <td><strong>{r.client}</strong></td>
//                       <td>{r.vertical}</td>
//                       <td><Badge type={r.source} /></td>
//                       <td>{r.empType || "—"}</td>
//                       <td className="muted">{r.remarks || "—"}</td>
//                     </tr>
//                   ))
//                 }
//               </tbody>
//             </table>
//           </div>
//         </div>
//       ))}
//     </>
//   );
// }