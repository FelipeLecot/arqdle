import crypto from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { config } from './config';
import { buildings, getBuilding } from './data';
import { dateKeyInTimeZone, dateKeyToUtc, dateLabelFor, dayNumberFor, isValidDateKey } from './dates';
import type { Building } from './types';

type Schedule = Record<string, string>;

function loadSchedule(): Schedule {
  const path = config.dailySchedulePath;
  if (!existsSync(path)) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`Could not parse daily schedule at ${path}: ${(error as Error).message}`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Daily schedule at ${path} must be a JSON object of date to building id.`);
  }

  const schedule: Schedule = {};
  for (const [dateKey, buildingId] of Object.entries(parsed)) {
    if (!isValidDateKey(dateKey)) {
      throw new Error(`Daily schedule has an invalid date: ${dateKey}`);
    }
    if (typeof buildingId !== 'string' || !getBuilding(buildingId)) {
      throw new Error(`Daily schedule points to an unknown building: ${String(buildingId)}`);
    }
    schedule[dateKey] = buildingId;
  }
  return schedule;
}

const schedule = loadSchedule();

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledBuildingIds(seed: string): string[] {
  const ids = [...buildings.map((building) => building.id)].sort();
  const random = mulberry32(hashString(seed));
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    [ids[index], ids[swapWith]] = [ids[swapWith], ids[index]];
  }
  return ids;
}

export interface DailySelection {
  building: Building;
  date: string;
  dateLabel: string;
  dayNumber: number;
}

export function dailySelectionFor(dateKey: string): DailySelection {
  const buildingId = schedule[dateKey];
  if (buildingId) {
    const pinned = getBuilding(buildingId);
    if (!pinned) throw new Error(`Scheduled building is missing: ${buildingId}`);
    return {
      building: pinned,
      date: dateKey,
      dateLabel: dateLabelFor(dateKey),
      dayNumber: dayNumberFor(dateKey, config.epoch),
    };
  }

  const ids = shuffledBuildingIds(`${config.dailySeed}:${config.epoch}`);
  const dayIndex = Math.round(
    (dateKeyToUtc(dateKey) - dateKeyToUtc(config.epoch)) / 86_400_000,
  );
  const cycle = Math.floor(dayIndex / ids.length);
  const position = ((dayIndex % ids.length) + ids.length) % ids.length;
  const order = cycle === 0 ? ids : shuffledBuildingIds(`${config.dailySeed}:${cycle}`);
  const building = getBuilding(order[position]);
  if (!building) throw new Error(`Could not select a daily building for ${dateKey}`);

  return {
    building,
    date: dateKey,
    dateLabel: dateLabelFor(dateKey),
    dayNumber: dayNumberFor(dateKey, config.epoch),
  };
}

export function todayDateKey(): string {
  return dateKeyInTimeZone(new Date(), config.timezone);
}

export function todayDailySelection(): DailySelection {
  return dailySelectionFor(todayDateKey());
}

export function randomPracticeBuilding(excludeIds: Iterable<string> = []): Building {
  const excluded = new Set(excludeIds);
  excluded.add(todayDailySelection().building.id);
  const pool = buildings.filter((building) => !excluded.has(building.id));
  const source = pool.length > 0 ? pool : buildings;
  return source[crypto.randomInt(source.length)];
}
