using UnityEngine;

[CreateAssetMenu(fileName = "NPCChar", menuName = "Scriptable Objects/NPCChar")]
public class NPCChar : ScriptableObject
{
    [Min(1)] public int MaxHP;
    public NPCType Type;
    public int likeability;
    public NPCInjuryState Helath;

    [field: SerializeField] public string DefinitionId { get; private set; }
    [field: SerializeField] public string Prefap { get; private set; }

    public int MaxHp => Mathf.Max(1, MaxHP);

    private void OnValidate()
    {
        MaxHP = Mathf.Max(1, MaxHP);
    }
}
