using Microsoft.EntityFrameworkCore;
using SpaceFleet.Api;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("FleetDb")
    ?? "Server=localhost;Port=3307;Database=space_fleet;User=fleet;Password=fleet-pass";
builder.Services.AddDbContext<FleetDbContext>(options => options.UseMySQL(connectionString));
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks().AddDbContextCheck<FleetDbContext>();
var app = builder.Build();
app.MapOpenApi();
app.MapHealthChecks("/health");

await using (var scope = app.Services.CreateAsyncScope()) {
    var db = scope.ServiceProvider.GetRequiredService<FleetDbContext>();
    await db.Database.EnsureCreatedAsync();
    if (!await db.Spaceships.AnyAsync()) {
        db.Spaceships.AddRange(new Spaceship { Name="Aurora", Class="Explorer", Crew=18 }, new Spaceship { Name="Atlas", Class="Cargo", Crew=6 });
        await db.SaveChangesAsync();
    }
}

var ships = app.MapGroup("/api/spaceships");
ships.MapGet("/", async (FleetDbContext db) => await db.Spaceships.AsNoTracking().ToListAsync());
ships.MapGet("/{id:int}", async (int id, FleetDbContext db) => await db.Spaceships.FindAsync(id) is { } ship ? Results.Ok(ship) : Results.NotFound());
ships.MapPost("/", async (SpaceshipInput input, FleetDbContext db) => { var ship=new Spaceship{Name=input.Name,Class=input.Class,Crew=input.Crew};db.Add(ship);await db.SaveChangesAsync();return Results.Created($"/api/spaceships/{ship.Id}",ship); });
ships.MapPut("/{id:int}", async (int id, SpaceshipInput input, FleetDbContext db) => { var ship=await db.Spaceships.FindAsync(id);if(ship is null)return Results.NotFound();ship.Name=input.Name;ship.Class=input.Class;ship.Crew=input.Crew;await db.SaveChangesAsync();return Results.Ok(ship); });
ships.MapDelete("/{id:int}", async (int id, FleetDbContext db) => { var ship=await db.Spaceships.FindAsync(id);if(ship is null)return Results.NotFound();db.Remove(ship);await db.SaveChangesAsync();return Results.NoContent(); });
app.Run();

