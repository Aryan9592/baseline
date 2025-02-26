pragma circom 2.1.5;

include "../../../../../../node_modules/circomlib/circuits/comparators.circom";
include "./utils/ecdsaSignatureVerifier.circom";
include "./utils/arithmeticOperators.circom";

template Workstep2(){

	signal input invoiceStatus;
	
	//Signature inputs
	signal input signature;
	signal input publicKeyX;
	signal input publicKeyY;
	signal input Tx;
	signal input Ty;
    	signal input Ux;
	signal input Uy;

	signal output isVerified;


	//1. Status == PAID
	component statusVerifier = StatusVerifier();
	statusVerifier.invoiceStatus <== invoiceStatus;	
	var isStatusVerified = statusVerifier.verified; 
	
	
	//2. Verify Signature
	component ecdsaSignatureVerifier = EcdsaSignatureVerifier();
	ecdsaSignatureVerifier.signature <== signature;
	ecdsaSignatureVerifier.publicKeyX <== publicKeyX;
	ecdsaSignatureVerifier.publicKeyY <== publicKeyY;
	ecdsaSignatureVerifier.Tx <== Tx;
	ecdsaSignatureVerifier.Ty <== Ty;
    	ecdsaSignatureVerifier.Ux <== Ux;
	ecdsaSignatureVerifier.Uy <== Uy;
	
	var isSignatureVerified = ecdsaSignatureVerifier.verified;


	component mul = Mul(2);
	mul.nums[0] <== isStatusVerified;
	mul.nums[1] <== isSignatureVerified;

	isVerified <== mul.result;
	
}

template StatusVerifier(){
	signal input invoiceStatus;
	
	signal output verified;

	//VERIFIED (as decimal utf-8 [80, 65, 73, 68])
	var status = 286; // status = 80 + 65 + 73 + 68

	component isStatusEqualPaid = IsEqual();

	isStatusEqualPaid.in[0] <== status;
	isStatusEqualPaid.in[1] <== invoiceStatus;	
	
	verified <== isStatusEqualPaid.out;

}



//declaring the public inputs
component main = Workstep2();