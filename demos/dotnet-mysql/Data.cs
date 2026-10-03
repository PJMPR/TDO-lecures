using Microsoft.EntityFrameworkCore;

namespace SpaceFleet.Api;

public sealed class FleetDbContext(DbContextOptions<FleetDbContext> options) : DbContext(options) {
    public DbSet<Spaceship> Spaceships => Set<Spaceship>();
    protected override void OnModelCreating(ModelBuilder modelBuilder) {
        modelBuilder.Entity<Spaceship>(entity => { entity.ToTable("spaceships");entity.HasKey(x=>x.Id);entity.Property(x=>x.Name).HasMaxLength(100).IsRequired();entity.Property(x=>x.Class).HasMaxLength(60).IsRequired(); });
    }
}
public sealed class Spaceship { public int Id {get;set;} public required string Name {get;set;} public required string Class {get;set;} public int Crew {get;set;} }
public sealed record SpaceshipInput(string Name,string Class,int Crew);

