namespace TaskManagement.API.Enums
{
    public enum Priority
    {
        Low = 1,
        Normal = 2,
        High = 3,
        Urgent = 4,
        Critical = 5
    }

    public enum Status
    {
        Pending = 0,
        InProgress = 1,
        Completed = 2,
        Cancelled = 3
    }
}