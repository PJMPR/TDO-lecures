using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace MissionControl.Api;

public sealed class MissionDbContext(DbContextOptions<MissionDbContext> options) : DbContext(options)
{
    public DbSet<Mission> Missions => Set<Mission>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Mission>(mission =>
        {
            mission.ToTable("missions");
            mission.HasKey(value => value.Id);
            mission.Property(value => value.Name).HasMaxLength(120).IsRequired();
            mission.Property(value => value.Status).HasMaxLength(30).IsRequired();
            // Connector/NET reads MySQL DATE values as DateTime.
            mission.Property(value => value.LaunchDate)
                .HasColumnName("launch_date")
                .HasColumnType("date")
                .HasConversion(new ValueConverter<DateOnly, DateTime>(
                    date => date.ToDateTime(TimeOnly.MinValue),
                    value => DateOnly.FromDateTime(value)
                ));
        });
    }
}
