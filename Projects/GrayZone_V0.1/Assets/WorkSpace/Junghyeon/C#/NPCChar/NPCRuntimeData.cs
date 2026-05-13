using UnityEngine;

public class NPCRuntimeData
{
    //ToDo : get Set 해놨는데 public으로 아래쪽에 함수 처리해둔거 맞는지
    //ToDo : 레벨시스템은 없지만 스태미나, 특수 능력치 향상 기능은 따로 필요한지
    public NPCChar NPCData { get; }
    //public NPCInjuryState CurrentInjuryState { get; private set; }
    public bool IsAssignedToShelter { get; private set; }
    public string AssignedShelterId { get; private set; }
    public string AssignedRoomId { get; private set; }
    public int CurrentHp { get; private set; }
    public int Fatigue { get; private set; }
    public int Stress { get; private set; }

    public int MaxHp => NPCData != null ? NPCData.MaxHp : 1;
    public bool IsDead => CurrentHp <= 0;

    public NPCRuntimeData(NPCChar npcData)
    {
        if (npcData == null)
        {
            throw new System.ArgumentNullException(nameof(npcData));
        }

        NPCData = npcData;
        ResetToBaseState();
    }

    public void ResetToBaseState()
    {
        CurrentHp = MaxHp;
        Fatigue = Mathf.Max(0, NPCData.StartFatigue);
        Stress = Mathf.Max(0, NPCData.StartStress);
        //CurrentInjuryState = NPCInjuryState.Healthy;
        ReleaseFromShelter();
    }

    //public NPCInjuryState GetCurrentInjuryState() => CurrentInjuryState;
    public bool GetIsAssignedToShelter() => IsAssignedToShelter;
    public string GetAssignedShelterId() => AssignedShelterId;
    public string GetAssignedRoomId() => AssignedRoomId;
    public int GetCurrentHp() => CurrentHp;
    public int GetFatigue() => Fatigue;
    public int GetStress() => Stress;

    //public void SetInjuryState(NPCInjuryState injuryState)
    //{
    //    CurrentInjuryState = injuryState;
    //}


    //ToDo : 셸터는 하나만 존재하는가? ( 하나만 존재하면 매개변수 하나 필요없음 )
    //룸에 들어가는 함수/ 이것도 필요한지 검토 필요
    //-> NPC가 내가 어떤 룸에 들어갔는지 알아야 할 필요는 없음, 들어갔느냐만 중요
    //어차피 어떤 NPC가 들어갔는지는 StaffRoster쪽에서 관리하기때문
    public bool AssignToShelter(string shelterId, string roomId)
    {
        if (string.IsNullOrWhiteSpace(shelterId) || string.IsNullOrWhiteSpace(roomId))
        {
            return false;
        }

        IsAssignedToShelter = true;
        AssignedShelterId = shelterId.Trim();
        AssignedRoomId = roomId.Trim();
        return true;
    }

    //룸에서 나올때 함수
    public void ReleaseFromShelter()
    {
        IsAssignedToShelter = false;
        AssignedShelterId = string.Empty;
        AssignedRoomId = string.Empty;
    }

    //현재 HP 설정함수 ( HP 업그레이드 또는 아이템 효과로 인한 hp 상승시 )
    public void SetCurrentHp(int value)
    {
        CurrentHp = Mathf.Clamp(value, 0, MaxHp);
    }

    //현재 HP 설정함수 ( 전투, 배치된 셸터가 파손되었을때 용도 )
    public bool ApplyDamage(int damage)
    {
        if (damage <= 0)
        {
            return false;
        }

        SetCurrentHp(CurrentHp - damage);
        return true;
    }

    //회복 함수
    public bool RecoverHp(int amount)
    {
        if (amount <= 0)
        {
            return false;
        }

        SetCurrentHp(CurrentHp + amount);
        return true;
    }

    //피로 수치 설정
    public void SetFatigue(int value)
    {
        Fatigue = Mathf.Max(0, value);
    }


    //피로 수치 증가
    public bool IncreaseFatigue(int amount)
    {
        if (amount <= 0)
        {
            return false;
        }

        SetFatigue(Fatigue + amount);
        return true;
    }

    // 피로 수치 감소
    public bool RecoverFatigue(int amount)
    {
        if (amount <= 0)
        {
            return false;
        }

        SetFatigue(Fatigue - amount);
        return true;
    }

    //스트레스 수치 설정
    public void SetStress(int value)
    {
        Stress = Mathf.Max(0, value);
    }

    //스트레스 상승
    public bool IncreaseStress(int amount)
    {
        if (amount <= 0)
        {
            return false;
        }

        SetStress(Stress + amount);
        return true;
    }

    //스트레스 감소
    public bool RecoverStress(int amount)
    {
        if (amount <= 0)
        {
            return false;
        }

        SetStress(Stress - amount);
        return true;
    }
}
