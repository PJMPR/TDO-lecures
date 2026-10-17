import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { type BoundFunctions, fireEvent, getByRole, queries, within } from '@testing-library/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppComponent } from './app.component';

describe('Mission Control', () => {
  let fixture: ComponentFixture<AppComponent>;
  let http: HttpTestingController;
  let screen: BoundFunctions<typeof queries>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
      teardown: { destroyAfterEach: true },
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AppComponent);
    const element: unknown = fixture.nativeElement;
    if (!(element instanceof HTMLElement)) {
      throw new Error('Mission Control must render an HTML element.');
    }
    screen = within(element);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    http.verify();
  });

  it('shows the second laboratory label', async () => {
    http.expectOne({ method: 'GET', url: '/api/missions' }).flush([]);
    await fixture.whenStable();

    expect(screen.getByText('MISSION CONTROL / LAB 02')).toBeDefined();
  });

  it('shows the missions returned by the API, including status and launch date', async () => {
    http.expectOne({ method: 'GET', url: '/api/missions' }).flush([
      { id: 7, name: 'Artemis', status: 'READY', launchDate: '2026-11-01' },
      { id: 8, name: 'Europa', status: 'PLANNED', launchDate: null },
    ]);
    await fixture.whenStable();

    const missions = screen.getAllByRole('article');
    expect(missions).toHaveLength(2);
    expect(getByRole(missions[0], 'heading', { name: 'Artemis' })).toBeDefined();
    expect(missions[0].textContent).toContain('#7 · READY');
    expect(missions[0].textContent).toContain('Start: 2026-11-01');
    expect(getByRole(missions[1], 'heading', { name: 'Europa' })).toBeDefined();
    expect(missions[1].textContent).toContain('Start: nie ustalono');
    expect(screen.getByRole('button', { name: 'Usuń Artemis' })).toBeDefined();
  });

  it('adds a mission using the selected status and launch date, then clears the completed fields', async () => {
    http.expectOne({ method: 'GET', url: '/api/missions' }).flush([]);
    await fixture.whenStable();

    const name = screen.getByRole<HTMLInputElement>('textbox', { name: 'Nazwa misji' });
    const status = screen.getByRole<HTMLSelectElement>('combobox', { name: 'Status' });
    const launchDate = screen.getByLabelText<HTMLInputElement>('Data startu');
    fireEvent.input(name, { target: { value: 'Artemis' } });
    fireEvent.change(status, { target: { value: 'READY' } });
    fireEvent.input(launchDate, { target: { value: '2026-11-01' } });
    await fixture.whenStable();
    screen.getByRole('button', { name: 'Dodaj misję' }).click();

    const request = http.expectOne({ method: 'POST', url: '/api/missions' });
    expect(request.request.body).toEqual({
      name: 'Artemis',
      status: 'READY',
      launchDate: '2026-11-01',
    });
    request.flush({ id: 9, name: 'Artemis', status: 'READY', launchDate: '2026-11-01' });
    http.expectOne({ method: 'GET', url: '/api/missions' }).flush([
      { id: 9, name: 'Artemis', status: 'READY', launchDate: '2026-11-01' },
    ]);
    await fixture.whenStable();

    expect(screen.getByRole('heading', { name: 'Artemis' })).toBeDefined();
    expect(name.value).toBe('');
    expect(launchDate.value).toBe('');
    expect(status.value).toBe('READY');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('adds a planned mission without a launch date', async () => {
    http.expectOne({ method: 'GET', url: '/api/missions' }).flush([]);
    await fixture.whenStable();

    fireEvent.input(screen.getByRole('textbox', { name: 'Nazwa misji' }), {
      target: { value: 'Europa' },
    });
    await fixture.whenStable();
    screen.getByRole('button', { name: 'Dodaj misję' }).click();

    const request = http.expectOne({ method: 'POST', url: '/api/missions' });
    expect(request.request.body).toEqual({
      name: 'Europa',
      status: 'PLANNED',
      launchDate: null,
    });
    request.flush({ id: 10, name: 'Europa', status: 'PLANNED', launchDate: null });
    http.expectOne({ method: 'GET', url: '/api/missions' }).flush([
      { id: 10, name: 'Europa', status: 'PLANNED', launchDate: null },
    ]);
    await fixture.whenStable();

    const mission = screen.getByRole('article');
    expect(getByRole(mission, 'heading', { name: 'Europa' })).toBeDefined();
    expect(mission.textContent).toContain('Start: nie ustalono');
  });

  it('removes only the selected mission and shows the remaining mission', async () => {
    http.expectOne({ method: 'GET', url: '/api/missions' }).flush([
      { id: 7, name: 'Artemis', status: 'READY', launchDate: '2026-11-01' },
      { id: 8, name: 'Europa', status: 'PLANNED', launchDate: null },
    ]);
    await fixture.whenStable();

    screen.getByRole('button', { name: 'Usuń Artemis' }).click();
    http.expectOne({ method: 'DELETE', url: '/api/missions/7' }).flush(null);
    http.expectOne({ method: 'GET', url: '/api/missions' }).flush([
      { id: 8, name: 'Europa', status: 'PLANNED', launchDate: null },
    ]);
    await fixture.whenStable();

    expect(screen.queryByRole('heading', { name: 'Artemis' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Europa' })).toBeDefined();
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });

  it('announces a visible HTTP failure when missions cannot be loaded', async () => {
    http.expectOne({ method: 'GET', url: '/api/missions' }).flush(null, {
      status: 503,
      statusText: 'Service Unavailable',
    });
    await fixture.whenStable();

    expect(screen.getByRole('alert').textContent).toBe('Nie udało się połączyć z API.');
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Dodaj misję' })).toBeDefined();
  });

  it.each(['', '   '])('rejects an empty mission name (%j) with visible validation and no HTTP submission', async (value) => {
    http.expectOne({ method: 'GET', url: '/api/missions' }).flush([]);
    await fixture.whenStable();

    fireEvent.input(screen.getByRole('textbox', { name: 'Nazwa misji' }), {
      target: { value },
    });
    await fixture.whenStable();
    screen.getByRole('button', { name: 'Dodaj misję' }).click();
    await fixture.whenStable();

    expect(screen.getByRole('alert').textContent).toBe('Nazwa misji jest wymagana.');
    http.expectNone('/api/missions');
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });

  it('announces a failed save without discarding the entered mission or existing list', async () => {
    http.expectOne({ method: 'GET', url: '/api/missions' }).flush([
      { id: 7, name: 'Artemis', status: 'READY', launchDate: '2026-11-01' },
    ]);
    await fixture.whenStable();

    const name = screen.getByRole<HTMLInputElement>('textbox', { name: 'Nazwa misji' });
    const status = screen.getByRole<HTMLSelectElement>('combobox', { name: 'Status' });
    const launchDate = screen.getByLabelText<HTMLInputElement>('Data startu');
    fireEvent.input(name, { target: { value: 'Europa' } });
    fireEvent.change(status, { target: { value: 'ACTIVE' } });
    fireEvent.input(launchDate, { target: { value: '2026-12-01' } });
    await fixture.whenStable();
    screen.getByRole('button', { name: 'Dodaj misję' }).click();
    http.expectOne({ method: 'POST', url: '/api/missions' }).flush(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
    await fixture.whenStable();

    expect(screen.getByRole('alert').textContent).toBe('Nie udało się zapisać misji.');
    expect(name.value).toBe('Europa');
    expect(status.value).toBe('ACTIVE');
    expect(launchDate.value).toBe('2026-12-01');
    expect(screen.getByRole('heading', { name: 'Artemis' })).toBeDefined();
    expect(screen.queryByRole('heading', { name: 'Europa' })).toBeNull();
    http.expectNone({ method: 'GET', url: '/api/missions' });
  });

  it('announces a failed deletion and keeps the mission visible', async () => {
    http.expectOne({ method: 'GET', url: '/api/missions' }).flush([
      { id: 7, name: 'Artemis', status: 'READY', launchDate: '2026-11-01' },
    ]);
    await fixture.whenStable();

    screen.getByRole('button', { name: 'Usuń Artemis' }).click();
    http.expectOne({ method: 'DELETE', url: '/api/missions/7' }).flush(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
    await fixture.whenStable();

    expect(screen.getByRole('alert').textContent).toBe('Nie udało się usunąć misji.');
    expect(screen.getByRole('heading', { name: 'Artemis' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Usuń Artemis' })).toBeDefined();
    http.expectNone({ method: 'GET', url: '/api/missions' });
  });

  it('allows retrying a failed deletion and clears the error after success', async () => {
    http.expectOne({ method: 'GET', url: '/api/missions' }).flush([
      { id: 7, name: 'Artemis', status: 'READY', launchDate: '2026-11-01' },
    ]);
    await fixture.whenStable();

    screen.getByRole('button', { name: 'Usuń Artemis' }).click();
    http.expectOne({ method: 'DELETE', url: '/api/missions/7' }).flush(null, {
      status: 503,
      statusText: 'Service Unavailable',
    });
    await fixture.whenStable();
    expect(screen.getByRole('alert').textContent).toBe('Nie udało się usunąć misji.');

    screen.getByRole('button', { name: 'Usuń Artemis' }).click();
    http.expectOne({ method: 'DELETE', url: '/api/missions/7' }).flush(null);
    http.expectOne({ method: 'GET', url: '/api/missions' }).flush([]);
    await fixture.whenStable();

    expect(screen.queryByRole('heading', { name: 'Artemis' })).toBeNull();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
