namespace MissionControl.Api;

public sealed class Mission
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Status { get; set; }
    public DateOnly? LaunchDate { get; set; }
}
