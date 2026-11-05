namespace MissionControl.Api;

public sealed record MissionRequest(string Name, string Status, DateOnly? LaunchDate)
{
    public Dictionary<string, string[]> GetValidationErrors()
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(Name))
        {
            errors["name"] = ["Nazwa misji jest wymagana."];
        }
        else if (Name.Length > 120)
        {
            errors["name"] = ["Nazwa misji może mieć najwyżej 120 znaków."];
        }

        if (Status is not ("PLANNED" or "READY" or "ACTIVE" or "COMPLETED"))
        {
            errors["status"] = ["Status musi mieć wartość PLANNED, READY, ACTIVE lub COMPLETED."];
        }

        return errors;
    }
}
