
//재화 종류
public enum CurrencyType
{
    Credit,
    Food,
    Medicine,
    RepairPart,
    RareCore,
    ResurrectionToken
}
public readonly struct CurrencyCost
{
    public CurrencyType Type { get; }
    public int Amount { get; }

    public CurrencyCost(CurrencyType type, int amount)
    {
        Type = type;
        Amount = amount;
    }
}