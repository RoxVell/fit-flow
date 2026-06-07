import { readFileSync } from "fs";
import type { BoostcampRow, BoostcampSession } from "./types";

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ";" && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  fields.push(current);
  return fields;
}

function parseRow(headers: string[], values: string[]): BoostcampRow {
  const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));

  const set = Number.parseInt(record.set, 10);
  const weight = record.weight === "" ? 0 : Number.parseFloat(record.weight);
  const reps = record.reps === "" ? 0 : Number.parseFloat(record.reps);

  if (!record.date || !record.exercise) {
    throw new Error(`Invalid row: missing date or exercise (${JSON.stringify(record)})`);
  }
  if (!Number.isFinite(set) || set < 1) {
    throw new Error(`Invalid set number for ${record.exercise} on ${record.date}`);
  }
  if (!Number.isFinite(weight) || weight < 0) {
    throw new Error(`Invalid weight for ${record.exercise} on ${record.date}`);
  }
  if (!Number.isFinite(reps) || reps < 0) {
    throw new Error(`Invalid reps for ${record.exercise} on ${record.date}`);
  }
  // Empty reps/weight are allowed (incomplete sets in Boostcamp export)
  if (record.unit && record.unit !== "kg") {
    throw new Error(`Unsupported unit "${record.unit}" for ${record.exercise} on ${record.date}`);
  }

  return {
    workout: record.workout,
    date: record.date,
    week: record.week,
    day: record.day,
    exercise: record.exercise,
    set,
    weight,
    unit: record.unit || "kg",
    reps,
  };
}

export function parseBoostcampCsv(content: string): BoostcampRow[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one data row");
  }

  const headers = parseCsvLine(lines[0]);
  const required = ["workout", "date", "week", "day", "exercise", "set", "weight", "unit", "reps"];
  for (const column of required) {
    if (!headers.includes(column)) {
      throw new Error(`Missing required column "${column}" in CSV header`);
    }
  }

  return lines.slice(1).map((line, index) => {
    try {
      return parseRow(headers, parseCsvLine(line));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Line ${index + 2}: ${message}`);
    }
  });
}

export function readBoostcampCsv(filePath: string): BoostcampRow[] {
  const content = readFileSync(filePath, "utf8");
  return parseBoostcampCsv(content);
}

export function groupRowsIntoSessions(rows: BoostcampRow[]): BoostcampSession[] {
  const sessionMap = new Map<string, BoostcampSession>();

  for (const row of rows) {
    const key = row.date;
    const existing = sessionMap.get(key);
    if (existing) {
      if (existing.workout !== row.workout || existing.day !== row.day || existing.week !== row.week) {
        throw new Error(
          `Conflicting session metadata for date ${row.date}: ` +
            `${existing.workout}/${existing.day} vs ${row.workout}/${row.day}`
        );
      }
      existing.rows.push(row);
      continue;
    }

    sessionMap.set(key, {
      date: row.date,
      workout: row.workout,
      week: row.week,
      day: row.day,
      rows: [row],
    });
  }

  return [...sessionMap.values()].sort((a, b) => parseBoostcampDate(a.date).getTime() - parseBoostcampDate(b.date).getTime());
}

export function getUniqueExerciseNames(rows: BoostcampRow[]): string[] {
  return [...new Set(rows.map((row) => row.exercise))].sort();
}

/** Boostcamp exports dates as DD.MM.YY */
export function parseBoostcampDate(date: string): Date {
  const match = date.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

  if (!match) {
    throw new Error(`Invalid Boostcamp date format: ${date}`);
  }

  const day = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const year = Number.parseInt(match[3], 10);

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

export function sessionTimestamps(date: string): { startedAt: string; endedAt: string } {
  const started = parseBoostcampDate(date);
  const ended = new Date(started.getTime() + 60 * 60 * 1000);
  return {
    startedAt: started.toISOString(),
    endedAt: ended.toISOString(),
  };
}
