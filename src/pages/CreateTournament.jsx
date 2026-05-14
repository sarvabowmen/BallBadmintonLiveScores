import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

function parseCsvText(rawText) {
  return rawText
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) =>
      line
        .split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)
        .map((value) => value.replace(/^\"(.*)\"$/, '$1').trim())
    );
}

function buildScheduleRows(rows) {
  if (!rows.length) {
    throw new Error('No rows found in file.');
  }

  const headers = (rows[0] || []).map((header) => String(header || '').replace(/^\uFEFF/, '').trim());
  const normalizedHeaders = headers.map((header) => header.toLowerCase());
  const indexOfHeader = (name) => normalizedHeaders.indexOf(name.toLowerCase());
  const fallback = { teamA: 0, teamB: 1, date: 2, time: 3, round: 4 };
  const teamAIndex = indexOfHeader('team a');
  const teamBIndex = indexOfHeader('team b');
  const dateIndex = indexOfHeader('date');
  const timeIndex = indexOfHeader('time');
  const roundIndex = indexOfHeader('round');

  return rows.slice(1)
    .filter((row) => row.some((value) => String(value || '').trim() !== ''))
    .map((row) => ({
      teamA: String(row[teamAIndex >= 0 ? teamAIndex : fallback.teamA] || '').trim(),
      teamB: String(row[teamBIndex >= 0 ? teamBIndex : fallback.teamB] || '').trim(),
      date: String(row[dateIndex >= 0 ? dateIndex : fallback.date] || '').trim(),
      time: String(row[timeIndex >= 0 ? timeIndex : fallback.time] || '').trim(),
      round: String(row[roundIndex >= 0 ? roundIndex : fallback.round] || '').trim(),
    }))
    .filter((match) => match.teamA && match.teamB);
}

function parseSchedule(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const isCsv = /\.csv$/i.test(file.name) || file.type === 'text/csv';

    reader.onload = (event) => {
      try {
        const rawData = event.target.result;
        let rows;

        if (isCsv) {
          rows = parseCsvText(rawData);
        } else {
          const workbook = XLSX.read(rawData, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        }

        const parsed = buildScheduleRows(rows);
        if (parsed.length === 0) {
          throw new Error('No valid schedule rows found.');
        }

        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = reject;
    if (isCsv) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}

export default function CreateTournament() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [excelFile, setExcelFile] = useState(null);
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    if (!excelFile) {
      setMessage('Please upload an Excel or CSV file to import the schedule.');
      return;
    }

    try {
      const schedule = await parseSchedule(excelFile);
      const payload = { name, location, startDate, schedule };
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        navigate(`/tournaments/${data.tournament.id}`);
      } else {
        setMessage(data.error || 'Unable to create tournament.');
      }
    } catch (error) {
      setMessage('Could not parse file. Ensure the spreadsheet or CSV includes Team A, Team B, Date, Time, and Round columns.');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Create Tournament</h1>
          <p className="page-notice">
            Upload the fixtures schedule using Excel or CSV. Required columns: Team A, Team B, Date, Time, Round.
          </p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 760 }}>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="name">Tournament Name</label>
            <input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="location">Location</label>
            <input id="location" value={location} onChange={(event) => setLocation(event.target.value)} />
          </div>
          <div className="input-group">
            <label htmlFor="startDate">Start Date</label>
            <input id="startDate" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="schedule">Upload Schedule (Excel or CSV)</label>
            <input id="schedule" type="file" accept=".xlsx,.xls,.csv" onChange={(event) => setExcelFile(event.target.files?.[0] || null)} required />
          </div>
          <div className="form-actions">
            <button type="submit">Create Tournament</button>
          </div>
          {message && <p className="error-message">{message}</p>}
        </form>
      </div>
    </div>
  );
}
