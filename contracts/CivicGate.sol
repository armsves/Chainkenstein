// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CivicGate {
    address public verifierKey;
    mapping(bytes32 => bool) public usedProofs;
    
    event ProofVerified(address indexed user, bytes32 proofHash);
    
    constructor(address _verifierKey) {
        verifierKey = _verifierKey;
    }
    
    function check(bytes calldata civicProof, address user) 
        external 
        returns (bool) 
    {
        if (civicProof.length == 0) {
            return true; // No proof required
        }
        
        bytes32 proofHash = keccak256(civicProof);
        require(!usedProofs[proofHash], "Proof already used");
        
        // Simplified verification for demo
        // In production, this would verify JWT signature or attestation
        bool isValid = _verifyProof(civicProof, user);
        
        if (isValid) {
            usedProofs[proofHash] = true;
            emit ProofVerified(user, proofHash);
        }
        
        return isValid;
    }
    
    function _verifyProof(bytes calldata proof, address user) 
        internal 
        pure //view 
        returns (bool) 
    {
        // Simplified demo verification
        // In production: verify JWT signature, check attestation, etc.
        return proof.length >= 32; // Mock verification
    }
}