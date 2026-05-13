using UnityEngine;

[CreateAssetMenu(fileName = "NPCChar", menuName = "Scriptable Objects/NPCChar")]
public class NPCChar : ScriptableObject
{
    [Min(1)] public int MaxHP;
    public NPCType Type;
     public int StartFatigue;
     public int StartStress;
    public int likeability;
    [field: SerializeField] public string ID { get; private set; }
    [field: SerializeField] public string Prefap { get; private set; }

    public int MaxHp => Mathf.Max(1, MaxHP);

    private void OnValidate()
    {
        MaxHP = Mathf.Max(1, MaxHP);
        StartFatigue = Mathf.Max(0, StartFatigue);
        StartStress = Mathf.Max(0, StartStress);
    }
}
