import JSZip from "jszip";
import { jsPDF } from "jspdf";

const asText = (value: unknown): string => value == null ? "" : String(value);
const number = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};
const normalizePhone = (value: unknown): string => asText(value).replace(/\D/g, "").replace(/^880/, "0");
const localDate = (value: unknown): string => {
  if (!value) return "";
  const date = new Date(asText(value));
  return Number.isNaN(date.getTime()) ? asText(value) : date.toLocaleString("en-GB", { timeZone: "Asia/Dhaka", hour12: true });
};
const contactKey = (record: any) => {
  const name = asText(record.guest_name).trim().toLocaleLowerCase();
  const phone = normalizePhone(record.phone);
  const email = asText(record.email).trim().toLocaleLowerCase();
  return asText(record.invitation_id) + "|" + (phone || email || name) + "|" + name;
};
const summaryName = (invitation: any) =>
  [invitation?.bride_name, invitation?.groom_name].filter(Boolean).join(" & ") || invitation?.slug || "Invitation";
const statusText = (status: string) =>
  status === "attending" ? "Attending" : status === "not_attending" ? "Declined" : "Pending";
const escaped = (value: unknown) => asText(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const xmlSafe = (value: unknown) => asText(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const downloadBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2500);
};
const nameForDownload = (report: WeddingGuestReport) =>
  "RamyaChobi_Guest_Report_" + (report.invitations.length === 1 ? asText(report.invitations[0].slug).replace(/[^a-z0-9_-]/gi, "_") : "All_Clients") + "_" + new Date().toISOString().slice(0,10);

export function buildWeddingGuestReport(payload: any, invitationId?: string) {
  const invitations = (payload.invitations || []).filter((invitation: any) => !invitationId || invitation.id === invitationId);
  const ids = new Set<string>(invitations.map((invitation: any) => invitation.id));
  const invitationById = new Map<string, any>(invitations.map((invitation: any) => [invitation.id, invitation]));
  const events = (payload.events || []).filter((event: any) => ids.has(event.invitation_id));
  const eventById = new Map<string, any>(events.map((event: any) => [event.id,event]));
  const guests = (payload.guests || []).filter((guest: any) => ids.has(guest.invitation_id));
  const responses = (payload.rsvps || []).filter((response: any) => ids.has(response.invitation_id))
    .sort((a: any,b: any) => Date.parse(asText(b.created_at)) - Date.parse(asText(a.created_at)));

  type Contact = { invitation_id: string; guest_name: string; phone: string; email: string; side: string;
    group_name: string; notes: string; message: string; status: string; attendee_count: number;
    max_attendees: number; source: string; responded_at: string; reviewed: string; event: string;
    lastChanged: number };
  const contactsByKey = new Map<string, Contact>();
  for (const guest of guests) {
    const responded = asText(guest.responded_at);
    const current: Contact = {
      invitation_id: guest.invitation_id, guest_name: asText(guest.guest_name),
      phone: asText(guest.phone), email: asText(guest.email),
      side: asText(guest.side), group_name: asText(guest.group_name),
      notes: asText(guest.notes), message: asText(guest.message),
      status: asText(guest.rsvp_status || "pending"),
      attendee_count: guest.rsvp_status === "attending" ? number(guest.attending_count) : 0,
      max_attendees: number(guest.max_attendees),
      source: "Personal guest link", responded_at: responded, reviewed: "Guest link",
      event: "All events", lastChanged: Date.parse(responded) || 0
    };
    contactsByKey.set(contactKey(guest), current);
  }
  // Keep every original RSVP in the audit sheet; use only the latest known reply per contact for totals.
  for (const response of [...responses].reverse()) {
    const key = contactKey(response);
    const existing = contactsByKey.get(key);
    const timestamp = Date.parse(asText(response.created_at)) || 0;
    if (existing && timestamp < existing.lastChanged) continue;
    contactsByKey.set(key, {
      invitation_id: response.invitation_id,
      guest_name: asText(response.guest_name),phone: asText(response.phone), email: asText(response.email),
      side: existing?.side || "",group_name: existing?.group_name || "",
      notes: existing?.notes || "", message: asText(response.message),
      status: asText(response.attendance), attendee_count: response.attendance === "attending" ? number(response.attendee_count) : 0,
      max_attendees: existing?.max_attendees || 0, source: "Public RSVP form",
      responded_at: asText(response.created_at), reviewed: response.reviewed ? "Reviewed" : "Unreviewed",
      event: response.event_id ? asText(eventById.get(response.event_id)?.title || "Specific event") : "All events",
      lastChanged: timestamp
    });
  }
  const contacts = [...contactsByKey.values()].sort((a,b)=>a.guest_name.localeCompare(b.guest_name));
  const accepted = contacts.filter(x => x.status === "attending");
  const declined = contacts.filter(x => x.status === "not_attending");
  const pending = contacts.filter(x => x.status !== "attending" && x.status !== "not_attending");
  const confirmedPeople = accepted.reduce((total,contact) => total + contact.attendee_count,0);
  const invitationCount = guests.reduce((total,guest)=> total + number(guest.max_attendees),0);
  const marked = responses.filter((x:any)=>x.reviewed).length;
  const unmarked = responses.length - marked;
  const completedGuestReplies = guests.filter((x:any)=>x.rsvp_status !== "pending");
  const responseRows = [
    ...responses.map((r:any) => ({
      invitation: summaryName(invitationById.get(r.invitation_id)), event: r.event_id ? asText(eventById.get(r.event_id)?.title || r.event_id) : "All events",
      name: asText(r.guest_name),phone:asText(r.phone),email:asText(r.email),
      status:statusText(asText(r.attendance)), count: r.attendance === "attending" ? number(r.attendee_count) : 0,
      message:asText(r.message), notes:"", reviewed:r.reviewed ? "Reviewed" : "Unreviewed",
      submitted:localDate(r.created_at),source:"Public RSVP"
    })),
    ...completedGuestReplies.map((g:any) => ({
      invitation:summaryName(invitationById.get(g.invitation_id)),event:"All events",
      name:asText(g.guest_name),phone:asText(g.phone),email:asText(g.email),
      status:statusText(asText(g.rsvp_status)), count: g.rsvp_status === "attending" ? number(g.attending_count) : 0,
      message:asText(g.message),notes:asText(g.notes),reviewed:"Personal link (no review field)",
      submitted:localDate(g.responded_at),source:"Personal guest link"
    }))
  ].sort((a,b)=>a.invitation.localeCompare(b.invitation)||a.name.localeCompare(b.name));
  const registeredRows = guests.map((g:any)=>({
    invitation:summaryName(invitationById.get(g.invitation_id)),name:asText(g.guest_name),
    phone:asText(g.phone),email:asText(g.email),side:asText(g.side),group:asText(g.group_name),
    allowance:number(g.max_attendees),status:statusText(asText(g.rsvp_status)),
    count:g.rsvp_status==="attending"?number(g.attending_count):0,
    notes:asText(g.notes),message:asText(g.message),responded:localDate(g.responded_at)
  }));
  const byInvitation = invitations.map((invitation:any)=>{
    const rows=contacts.filter(x=>x.invitation_id===invitation.id);
    return {
      name:summaryName(invitation),slug:asText(invitation.slug),contactCount:rows.length,
      attending:rows.filter(x=>x.status==="attending").length,
      declined:rows.filter(x=>x.status==="not_attending").length,
      pending:rows.filter(x=>!["attending","not_attending"].includes(x.status)).length,
      confirmed:rows.filter(x=>x.status==="attending").reduce((t,x)=>t+x.attendee_count,0)
    };
  });
  const byEvent = events.map((e:any)=>{
    const eventResponses = responses.filter((r:any)=>r.event_id === e.id);
    const latest = new Map<string,any>();
    for(const row of [...eventResponses].reverse())latest.set(contactKey(row),row);
    const values=[...latest.values()];
    return {
      name:summaryName(invitationById.get(e.invitation_id)),event:asText(e.title),date:asText(e.event_date),
      responses:eventResponses.length,attending:values.filter((x:any)=>x.attendance==="attending").length,
      confirmed:values.filter((x:any)=>x.attendance==="attending").reduce((t:number,x:any)=>t+number(x.attendee_count),0)
    };
  });
  return {
    invitations,contacts,responses,guests,responseRows,registeredRows,byInvitation,byEvent,
    metrics: {
      invitations:invitations.length,registeredGuests:guests.length,invitedCapacity:invitationCount,
      uniqueContacts:contacts.length,answered:accepted.length+declined.length,
      attending:accepted.length,declined:declined.length,pending:pending.length,
      confirmedPeople,submissions:responses.length,personalLinkReplies:completedGuestReplies.length,
      marked,unmarked,notesCount:responseRows.filter(row=>row.message.trim()||row.notes.trim()).length
    }
  };
}
export type WeddingGuestReport = ReturnType<typeof buildWeddingGuestReport>;

function columnName(index: number) {
  let value = index + 1, result = "";
  while(value > 0) { result = String.fromCharCode(65 + (value - 1) % 26) + result; value = Math.floor((value - 1)/26); }
  return result;
}
function sheetXml(rows: unknown[][]) {
  const content=rows.map((row,index)=>"<row r=\"" + (index+1) + "\">" +
    row.map((value,j)=>"<c r=\"" + columnName(j) + (index+1) + "\" s=\"" + (index===0?1:0) + "\" t=\"inlineStr\"><is><t xml:space=\"preserve\">" + xmlSafe(value) + "</t></is></c>").join("") +
    "</row>").join("");
  return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetViews><sheetView workbookViewId=\"0\"/></sheetViews><sheetFormatPr defaultRowHeight=\"16\"/><sheetData>" + content + "</sheetData></worksheet>";
}
export async function downloadWeddingGuestWorkbook(report: WeddingGuestReport) {
  const m=report.metrics;
  const summary: unknown[][] = [
    ["RAMYACHOBI - WEDDING GUEST REPORT","Value"],
    ["Report generated",localDate(new Date().toISOString())],
    ["Invitations",m.invitations],["Registered guest records",m.registeredGuests],
    ["Maximum registered seat allowance",m.invitedCapacity],
    ["Unique identified contacts",m.uniqueContacts],
    ["Contacts with RSVP reply",m.answered],
    ["Attending contacts",m.attending],["Declined contacts",m.declined],
    ["Pending contacts",m.pending],["Confirmed attendees (people)",m.confirmedPeople],
    ["Public RSVP submissions (including repeat submissions)",m.submissions],
    ["Personal-link replies",m.personalLinkReplies],
    ["Public replies marked reviewed",m.marked],
    ["Public replies awaiting review",m.unmarked],
    ["Entries with notes/messages",m.notesCount],
    [],["Per invitation","Slug","Known contacts","Attending contacts","Declined contacts","Pending contacts","Confirmed people"],
    ...report.byInvitation.map(x=>[x.name,x.slug,x.contactCount,x.attending,x.declined,x.pending,x.confirmed]),
    [],["Per event","Event","Date","Public submissions","Attending contacts","Confirmed people"],
    ...report.byEvent.map(x=>[x.name,x.event,x.date,x.responses,x.attending,x.confirmed]),
    [],["COUNTING RULE","Overall unique contacts are calculated from the most recent response per invitation/contact. Multiple submitted responses remain in the RSVP sheet. Registered guest-link replies are included. Event counts refer only to responses choosing that specific event. Actual on-site attendance is not automatically verified."]
  ];
  const responseRows: unknown[][] = [
    ["Invitation","Event","Guest name","WhatsApp / phone","Email","Attendance","No. of attendees","Guest message / note","Private guest notes","Review marking","Submitted at","Source","Manual check-in"],
    ...report.responseRows.map(x=>[x.invitation,x.event,x.name,x.phone,x.email,x.status,x.count,x.message,x.notes,x.reviewed,x.submitted,x.source,""])
  ];
  const registerRows: unknown[][] = [
    ["Invitation","Guest name","WhatsApp / phone","Email","Side","Family / group","Max allowed","RSVP status","Attending people","Admin notes","Guest message","Response date","Manual check-in"],
    ...report.registeredRows.map(x=>[x.invitation,x.name,x.phone,x.email,x.side,x.group,x.allowance,x.status,x.count,x.notes,x.message,x.responded,""])
  ];
  const zip=new JSZip();
  const names=["Summary","RSVP Responses","Guest Register"];
  const sheets=[summary,responseRows,registerRows];
  zip.file("[Content_Types].xml",'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+names.map((_,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join("")+'</Types>');
  zip.file("_rels/.rels",'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.file("xl/workbook.xml",'<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+names.map((name,i)=>'<sheet name="'+xmlSafe(name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join("")+'</sheets></workbook>');
  zip.file("xl/_rels/workbook.xml.rels",'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+names.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join("")+'<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
  zip.file("xl/styles.xml",'<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF542A26"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>');
  sheets.forEach((rows,i)=>zip.file("xl/worksheets/sheet"+(i+1)+".xml",sheetXml(rows)));
  downloadBlob(await zip.generateAsync({type:"blob",compression:"DEFLATE"}),nameForDownload(report)+".xlsx");
}
function pdfSafe(s:unknown) {
  return asText(s).replace(/[^\x20-\x7e\u00a0-\u00ff]/g,"?");
}
function htmlPrintable(report:WeddingGuestReport) {
 const m=report.metrics;
 const fields:[string,string][]=[
  ["Registered guests",asText(m.registeredGuests)],["Invited seat allowance",asText(m.invitedCapacity)],
  ["Unique contacts",asText(m.uniqueContacts)],["Responded contacts",asText(m.answered)],
  ["Attending contacts",asText(m.attending)],["Declined contacts",asText(m.declined)],
  ["Pending contacts",asText(m.pending)],["Confirmed people",asText(m.confirmedPeople)],
  ["Public submissions",asText(m.submissions)],["Personal-link replies",asText(m.personalLinkReplies)],
  ["Reviewed",asText(m.marked)],["Unreviewed",asText(m.unmarked)]
 ];
 const table=(headers:string[],rows:unknown[][])=>"<table><thead><tr>"+headers.map(h=>"<th>"+escaped(h)+"</th>").join("")+"</tr></thead><tbody>"+rows.map(row=>"<tr>"+row.map(cell=>"<td>"+escaped(cell)+"</td>").join("")+"</tr>").join("")+"</tbody></table>";
 const inviteTable=table(["Invitation","Contacts","Attending","Declined","Pending","Confirmed people"],report.byInvitation.map(x=>[x.name,x.contactCount,x.attending,x.declined,x.pending,x.confirmed]));
 const responseTable=table(["Mark","Guest name / number","Status / headcount","Message and notes","Date / source"],report.responseRows.map(x=>["\u2610",x.name+"\n"+x.phone+"\n"+x.invitation+"\n"+x.event,x.status+" / "+x.count+"\n"+x.reviewed,[x.message,x.notes].filter(Boolean).join("\n"),x.submitted+"\n"+x.source]));
 const guestTable=table(["Check-in","Guest","Status","Seats","Notes"],report.registeredRows.map(x=>["\u2610",x.name+"\n"+x.phone+"\n"+x.group,x.status,x.count+" / "+x.allowance,[x.notes,x.message].filter(Boolean).join("\n")]));
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>RamyaChobi Guest Report</title><style>@page{size:A4;margin:13mm}body{font-family:"Noto Sans Bengali","Noto Sans",Arial,sans-serif;color:#28241e;font-size:10pt;margin:16px}h1{color:#5b2727;font-size:22pt;margin:0}h2{color:#5b2727;margin:22px 0 9px;font-size:15pt}p{margin:6px 0}.muted{color:#766f63}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:15px 0}.metric{border:1px solid #d9d1bb;background:#faf8f1;padding:8px;border-radius:7px}.metric strong{display:block;font-size:15pt;color:#77582c}table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:8.1pt;word-wrap:break-word;white-space:pre-wrap}th{background:#5b2727;color:white;text-align:left}th,td{border:1px solid #d9d1bb;padding:6px;vertical-align:top}tr{break-inside:avoid}.note{border:1px solid #e0d7c4;padding:9px;margin:12px 0;background:#fbf7e9}@media print{body{margin:0}h2{break-after:avoid}.metrics{break-inside:avoid}.avoid{break-inside:avoid}}<\/style></head><body><h1>RAMYACHOBI</h1><p class="muted">WEDDING GUEST REPORT · '+escaped(localDate(new Date().toISOString()))+'</p><p>Scope: '+escaped(report.invitations.length===1?summaryName(report.invitations[0]):"All invitation clients")+'</p><h2>Attendance & response summary</h2><div class="metrics">'+fields.map(([label,value])=>'<div class="metric"><span>'+escaped(label)+'</span><strong>'+escaped(value)+'</strong></div>').join("")+'</div><div class="note"><b>Counting:</b> Confirmed people sums the latest attending reply per identifiable contact. Repeat public RSVPs remain in the full response list; registered guest-link replies are also included. This is an RSVP estimate, not a confirmed on-site check-in. Blank tick boxes are provided for manual marking.</div><h2>Per-invitation totals</h2>'+inviteTable+'<h2>All RSVP responses and messages ('+report.responseRows.length+')</h2>'+responseTable+'<h2>Registered guest list ('+report.registeredRows.length+')</h2>'+guestTable+'<p class="muted">RamyaChobi - Confidential client information. Handle phone numbers and guest notes privately.</p></body></html>';
}
export function printWeddingGuestReport(report: WeddingGuestReport) {
  const popup=window.open("","_blank");
  if(!popup)throw new Error("Your browser blocked the PDF print window. Allow pop-ups or try again.");
  popup.document.open();
  popup.document.write(htmlPrintable(report));
  popup.document.close();
  popup.focus();
  popup.setTimeout(()=>{popup.print()},450);
}
export function downloadWeddingGuestPdf(report: WeddingGuestReport) {
  // Standard embedded jsPDF fonts cannot render Bengali script. Use browser's Unicode
  // print/PDF engine whenever notes or names contain non-Latin writing.
  const text=[...report.responseRows.map(x=>[x.name,x.message,x.notes,x.invitation].join("")),...report.registeredRows.map(x=>[x.name,x.notes,x.message].join(""))].join("");
  if(/[^\x09-\x7e\u00a0-\u00ff]/.test(text)) { printWeddingGuestReport(report); return; }
  const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
  const width=210, margin=15, pageBottom=280;
  let y=16, page=1;
  const header=()=>{
    pdf.setFillColor(83,40,39);pdf.rect(0,0,width,13,"F");
    pdf.setFont("helvetica","bold");pdf.setTextColor(255,255,255);pdf.setFontSize(11);pdf.text("RAMYACHOBI  |  WEDDING GUEST REPORT",margin,9);
    pdf.setTextColor(45,40,35);pdf.setFont("helvetica","normal");
  };
  const footer=()=>{pdf.setFontSize(8);pdf.setTextColor(130,120,110);pdf.text("Private client report  |  Page "+page,margin,289);pdf.setTextColor(45,40,35)};
  const nextPage=()=>{footer();pdf.addPage();page++;y=18;header()};
  const need=(space:number)=>{if(y+space>pageBottom)nextPage()};
  const line=(text:unknown,size=10,emphasis=false,space=3)=>{
    pdf.setFont("helvetica",emphasis?"bold":"normal");pdf.setFontSize(size);
    const wrapped=pdf.splitTextToSize(pdfSafe(text),width-margin*2);
    const height=Math.max(5,wrapped.length*(size/3.1)+space);
    need(height);pdf.text(wrapped,margin,y);y+=height;
  };
  header();
  y=21;
  line("Generated: "+localDate(new Date().toISOString()),9);
  line("Scope: "+(report.invitations.length===1?summaryName(report.invitations[0]):"All invitation clients"),11,true,7);
  const m=report.metrics;
  line("ATTENDANCE SUMMARY",13,true);
  const metrics=[
    ["Registered guest records",m.registeredGuests],["Invited seat allowance",m.invitedCapacity],
    ["Unique contacts",m.uniqueContacts],["Responded contacts",m.answered],
    ["Attending contacts",m.attending],["Declined contacts",m.declined],
    ["Pending",m.pending],["Confirmed attendees (people)",m.confirmedPeople],
    ["Public submissions",m.submissions],["Personal guest link replies",m.personalLinkReplies],
    ["Reviewed submissions",m.marked],["Awaiting review",m.unmarked]
  ];
  metrics.forEach(([label,value])=>{need(6);pdf.setFontSize(10);pdf.setFont("helvetica","normal");pdf.text(asText(label),margin,y);pdf.setFont("helvetica","bold");pdf.text(asText(value),width-margin,y,{align:"right"});y+=6});
  y+=4;
  line("Tally is based on latest reply per contact; all historical submissions are listed below. On-site presence must be marked manually.",8,false,5);
  line("PER-INVITATION TOTALS",13,true);
  report.byInvitation.forEach(x=>line(x.name+": "+x.confirmed+" people confirmed | "+x.attending+" attending contacts | "+x.declined+" declined | "+x.pending+" pending",9));
  y+=4;line("RSVP RESPONSES & GUEST MESSAGES ("+report.responseRows.length+")",13,true);
  for(let i=0;i<report.responseRows.length;i++){
    const r=report.responseRows[i];
    const title=(i+1)+". "+r.name+" ("+r.status+", "+r.count+" people)";
    need(21);
    pdf.setDrawColor(198,186,165);pdf.rect(margin,y-3,4,4);
    pdf.setFontSize(9);pdf.setFont("helvetica","bold");pdf.text(pdfSafe(title),margin+7,y);y+=5;
    line("Invitation: "+r.invitation+" | Event: "+r.event+" | Review: "+r.reviewed,8);
    line("WhatsApp: "+r.phone+" | Email: "+r.email+" | Submitted: "+r.submitted,8);
    if(r.message)line("Guest message: "+r.message,9);
    if(r.notes)line("Private notes: "+r.notes,9);
    y+=3;
  }
  need(24);line("REGISTERED GUEST DIRECTORY ("+report.registeredRows.length+")",13,true);
  for(let i=0;i<report.registeredRows.length;i++){
    const r=report.registeredRows[i];
    need(17);
    pdf.setDrawColor(198,186,165);pdf.rect(margin,y-3,4,4);
    pdf.setFontSize(9);pdf.setFont("helvetica","bold");pdf.text(pdfSafe((i+1)+". "+r.name+" ("+r.status+")"),margin+7,y);y+=5;
    line("Phone: "+r.phone+" | Group: "+r.group+" | Attending: "+r.count+" / "+r.allowance,8);
    if(r.notes)line("Admin notes: "+r.notes,8);
    if(r.message)line("Guest message: "+r.message,8);
    y+=2;
  }
  footer();
  pdf.save(nameForDownload(report)+".pdf");
}
