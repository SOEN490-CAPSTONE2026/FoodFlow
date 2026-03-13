package com.example.foodflow.repository;

import com.example.foodflow.model.entity.Invoice;
import com.example.foodflow.model.types.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    
    Optional<Invoice> findByPaymentId(Long paymentId);
    
    @Query("SELECT i FROM Invoice i WHERE i.payment.organization.id = :organizationId ORDER BY i.createdAt DESC")
    Page<Invoice> findByOrganizationId(@Param("organizationId") Long organizationId, Pageable pageable);
    
    List<Invoice> findByStatus(InvoiceStatus status);
    
    @Query("SELECT i FROM Invoice i WHERE i.status = :status AND i.dueDate < :date")
    List<Invoice> findOverdueInvoices(@Param("status") InvoiceStatus status, @Param("date") LocalDate date);
}
