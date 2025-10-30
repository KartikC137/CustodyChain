// This component is a Mock for database and simply updates its own list of all the evidences

import { Address } from "viem";

type callType = "read" | "create" | "discontinue" | "transfer";
type accountType = "owner" | "creator";

export interface Evidence {
  isActive: boolean;
  evidenceId: `0x${string}`;
  description: string;
  creator: Address;
  currentOwner: Address;
}

export interface AccountProfile {
  address: Address;
  type: accountType;
  evidencesCreated?: Evidence[];
  evidencesOwned?: Evidence[];
}

export interface MockEvidenceDataManagerProps {
  account: Address;
  accountTo?: Address;
  accountType: accountType;
  evidence: Evidence;
  call: callType;
}

let allAccounts: AccountProfile[] = [];

function findOrCreateAccountProfile(
  accountAddress: Address,
  type: accountType
) {
  const targetAddress = accountAddress.toLowerCase();
  let profile = allAccounts.find(
    (p) => p.address.toLowerCase() === targetAddress
  );

  if (!profile) {
    console.log(`Creating new Account Profile for ${accountAddress}...`);
    profile = {
      address: accountAddress,
      type: type,
      evidencesCreated: [] as Evidence[],
      evidencesOwned: [] as Evidence[],
    };
    allAccounts.push(profile);
  }
  return profile;
}

export default function MockEvidenceDataManager({
  account,
  accountTo,
  accountType,
  evidence,
  call,
}: MockEvidenceDataManagerProps): boolean | Evidence[] {
  if (!account && !accountType && !evidence && !call) {
    console.error("MockEvidenceDataManager: Invalid Call, missing prop values");
    return false;
  }

  const accountProfile = findOrCreateAccountProfile(account, accountType);
  if (!accountProfile) {
    console.error(
      "MockEvidenceDataManager: Could not create/find account profile: ",
      account
    );
    return false;
  }
  if (call === "read") {
    if (accountType === "creator" && accountProfile.evidencesCreated) {
      return accountProfile.evidencesCreated;
    }
    if (accountType === "owner" && accountProfile.evidencesOwned) {
      return accountProfile.evidencesOwned;
    }
    return false;
  }

  if (call === "create") {
    if (accountType === "creator") {
      if (!accountProfile.evidencesCreated) {
        accountProfile.evidencesCreated = [] as Evidence[];
      }
      if (!accountProfile.evidencesOwned) {
        accountProfile.evidencesOwned = [] as Evidence[];
      }
      accountProfile.evidencesCreated.push(evidence);
      accountProfile.evidencesOwned.push(evidence);
      evidence.creator = account;
      evidence.currentOwner = account;
    }
    return false;
  }

  if (call === "discontinue") {
    if (accountType === "creator" && accountProfile.evidencesCreated) {
      const foundEvidence: Evidence | undefined =
        accountProfile.evidencesCreated.find(
          (item) =>
            item.evidenceId.toLowerCase() === evidence.evidenceId.toLowerCase()
        );
      if (foundEvidence) {
        foundEvidence.isActive = false;
        evidence.isActive = false;
      } else {
        console.error(
          "MockEvidenceDataManager: No Evidences created/found: ",
          account
        );
        return false;
      }
      return true;
    } else {
      console.error(
        "MockEvidenceDataManager: Account is not a creator:",
        account,
        "  ",
        accountType
      );
      return false;
    }
  }

  if (call === "transfer" && accountTo) {
    if (account === accountTo) {
      console.error(
        "MockEvidenceDataManager: Account is already the current owner."
      );
      return false;
    }
    if (!accountProfile.evidencesOwned) {
      console.error(
        "MockEvidenceDataManager: Current owner profile has no owned evidence list."
      );
      return false;
    }
    if (evidence.currentOwner !== account) {
      console.error(
        "MockEvidenceDataManager: Account is not Current Owner: ",
        account
      );
      return false;
    }

    const evidenceIndex = accountProfile.evidencesOwned.findIndex(
      (item) =>
        item.evidenceId.toLowerCase() === evidence.evidenceId.toLowerCase()
    );

    if (evidenceIndex === -1) {
      console.error(
        "MockEvidenceDataManager: Evidence not found in current owner's owned list."
      );
      return false;
    }

    const accountToProfile = findOrCreateAccountProfile(accountTo, accountType);
    if (!accountToProfile) {
      console.error(
        "MockEvidenceDataManager: Could not create/find account profile"
      );
      return false;
    }

    if (!accountToProfile.evidencesOwned) {
      accountToProfile.evidencesOwned = [] as Evidence[];
    }
    const [removedEvidence] = accountProfile.evidencesOwned.splice(
      evidenceIndex,
      1
    );
    const alreadyOwns = accountToProfile.evidencesOwned.some(
      (item) =>
        item.evidenceId.toLowerCase() ===
        removedEvidence.evidenceId.toLowerCase()
    );

    if (!alreadyOwns) {
      removedEvidence.currentOwner = accountToProfile.address;
      accountToProfile.evidencesOwned.push(removedEvidence);
    }

    return true;
  } else {
    console.error("MockEvidenceDataManager: Account Profile not found");
    return false;
  }
}
